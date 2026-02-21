import Stripe from "stripe"

// Initialize Stripe with environment variable
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null

  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  })
}

interface ProductData {
  id: string
  sku: string
  name: string
  description: string | null
  price: number // in currency units (e.g., 999 for 999 EUR)
  compareAtPrice?: number | null
  images?: { url: string; isPrimary: boolean }[]
  stripeProductId?: string | null
  stripePriceId?: string | null
}

interface SyncResult {
  success: boolean
  stripeProductId?: string
  stripePriceId?: string
  error?: string
}

/**
 * Create a product on Stripe
 */
export async function createStripeProduct(product: ProductData): Promise<SyncResult> {
  const stripe = getStripe()
  if (!stripe) {
    return { success: false, error: "Stripe not configured" }
  }

  try {
    // Get currency from settings or default to EUR
    const currency = process.env.STRIPE_CURRENCY || "eur"

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
      name: product.name,
      description: product.description || undefined,
      metadata: {
        dashboard_id: product.id,
        sku: product.sku,
      },
      images: product.images
        ?.filter(img => img.url)
        .slice(0, 8) // Stripe allows max 8 images
        .map(img => img.url) || undefined,
    })

    // Create price for the product
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(product.price * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        dashboard_id: product.id,
        sku: product.sku,
      },
    })

    console.log(`[Stripe Sync] Created product: ${stripeProduct.id}, price: ${stripePrice.id}`)

    return {
      success: true,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    }
  } catch (error) {
    console.error("[Stripe Sync] Error creating product:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create Stripe product",
    }
  }
}

/**
 * Update a product on Stripe
 */
export async function updateStripeProduct(product: ProductData): Promise<SyncResult> {
  const stripe = getStripe()
  if (!stripe) {
    return { success: false, error: "Stripe not configured" }
  }

  if (!product.stripeProductId) {
    // Product doesn't exist on Stripe yet, create it
    return createStripeProduct(product)
  }

  try {
    const currency = process.env.STRIPE_CURRENCY || "eur"

    // Update Stripe product
    await stripe.products.update(product.stripeProductId, {
      name: product.name,
      description: product.description || undefined,
      metadata: {
        dashboard_id: product.id,
        sku: product.sku,
      },
      images: product.images
        ?.filter(img => img.url)
        .slice(0, 8)
        .map(img => img.url) || undefined,
    })

    // Check if price changed - if so, archive old price and create new one
    let newPriceId = product.stripePriceId

    if (product.stripePriceId) {
      const existingPrice = await stripe.prices.retrieve(product.stripePriceId)
      const newAmount = Math.round(product.price * 100)

      if (existingPrice.unit_amount !== newAmount) {
        // Archive old price
        await stripe.prices.update(product.stripePriceId, { active: false })

        // Create new price
        const newPrice = await stripe.prices.create({
          product: product.stripeProductId,
          unit_amount: newAmount,
          currency: currency.toLowerCase(),
          metadata: {
            dashboard_id: product.id,
            sku: product.sku,
          },
        })
        newPriceId = newPrice.id
        console.log(`[Stripe Sync] Price updated: ${product.stripePriceId} -> ${newPrice.id}`)
      }
    } else {
      // No price exists, create one
      const newPrice = await stripe.prices.create({
        product: product.stripeProductId,
        unit_amount: Math.round(product.price * 100),
        currency: currency.toLowerCase(),
        metadata: {
          dashboard_id: product.id,
          sku: product.sku,
        },
      })
      newPriceId = newPrice.id
    }

    console.log(`[Stripe Sync] Updated product: ${product.stripeProductId}`)

    return {
      success: true,
      stripeProductId: product.stripeProductId,
      stripePriceId: newPriceId || undefined,
    }
  } catch (error) {
    console.error("[Stripe Sync] Error updating product:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update Stripe product",
    }
  }
}

/**
 * Archive a product on Stripe (Stripe doesn't allow deletion)
 */
export async function archiveStripeProduct(stripeProductId: string): Promise<SyncResult> {
  const stripe = getStripe()
  if (!stripe) {
    return { success: false, error: "Stripe not configured" }
  }

  if (!stripeProductId) {
    return { success: true } // Nothing to archive
  }

  try {
    // Archive the product (set active to false)
    await stripe.products.update(stripeProductId, {
      active: false,
    })

    console.log(`[Stripe Sync] Archived product: ${stripeProductId}`)

    return {
      success: true,
      stripeProductId,
    }
  } catch (error) {
    console.error("[Stripe Sync] Error archiving product:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive Stripe product",
    }
  }
}

/**
 * Sync all products from dashboard to Stripe
 */
export async function syncAllProducts(products: ProductData[]): Promise<{
  success: boolean
  synced: number
  failed: number
  results: Array<{ id: string; success: boolean; error?: string }>
}> {
  const results: Array<{ id: string; success: boolean; error?: string }> = []
  let synced = 0
  let failed = 0

  for (const product of products) {
    const result = product.stripeProductId
      ? await updateStripeProduct(product)
      : await createStripeProduct(product)

    results.push({
      id: product.id,
      success: result.success,
      error: result.error,
    })

    if (result.success) {
      synced++
    } else {
      failed++
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    results,
  }
}
