import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

/**
 * Find the pricing region for a country code
 * Priority: exact country match > default region (ROW)
 */
async function getRegionForCountry(countryCode: string | null) {
  if (!countryCode) {
    // Return default region if no country specified
    return prisma.pricingRegion.findFirst({
      where: { isDefault: true },
    })
  }

  // First, try to find a region that includes this country
  const region = await prisma.pricingRegion.findFirst({
    where: {
      countries: {
        has: countryCode.toUpperCase(),
      },
    },
  })

  if (region) {
    return region
  }

  // Fallback to default region
  return prisma.pricingRegion.findFirst({
    where: { isDefault: true },
  })
}

/**
 * GET /api/external/products
 * Returns active products for external stores
 * Query params:
 *   - sku: filter by SKU
 *   - id: filter by ID
 *   - slug: filter by slug
 *   - featured: filter featured products
 *   - category: filter by category slug
 *   - country: 2-letter country code for regional pricing (e.g., "US", "DE", "GB")
 */
export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "read")) {
    return NextResponse.json(
      { error: "Missing required permission: read" },
      { status: 403, headers }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const sku = searchParams.get("sku")
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")
    const featured = searchParams.get("featured")
    const categorySlug = searchParams.get("category")
    const country = searchParams.get("country")

    // Get the pricing region for this country
    const region = await getRegionForCountry(country)

    // Build where clause
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    }

    if (sku) {
      where.sku = sku
    }

    if (id) {
      where.id = id
    }

    if (slug) {
      where.slug = slug
    }

    if (featured === "true") {
      where.featured = true
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      }
    }

    // Fetch products with images and regional prices
    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: { position: "asc" },
          take: 5,
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        inventory: {
          select: {
            quantityAvailable: true,
          },
        },
        regionalPrices: region ? {
          where: { regionId: region.id },
          select: {
            price: true,
            compareAtPrice: true,
          },
        } : false,
      },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
    })

    // Transform products to external format
    const externalProducts = products.map((product) => {
      // Calculate total available stock across all warehouses
      const totalStock = product.inventory.reduce(
        (sum, inv) => sum + inv.quantityAvailable,
        0
      )

      // Get regional price if available, otherwise use base price
      const regionalPrice = product.regionalPrices?.[0]
      const price = regionalPrice ? Number(regionalPrice.price) : Number(product.price)
      const compareAtPrice = regionalPrice
        ? (regionalPrice.compareAtPrice ? Number(regionalPrice.compareAtPrice) : null)
        : (product.compareAtPrice ? Number(product.compareAtPrice) : null)

      return {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price,
        compareAtPrice,
        currency: region?.currency ?? "USD",
        regionCode: region?.code ?? "ROW",
        stock: totalStock,
        isActive: product.status === "ACTIVE",
        featured: product.featured,
        images: product.images.map((img) => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
        })),
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        } : null,
      }
    })

    return NextResponse.json({
      success: true,
      products: externalProducts,
      count: externalProducts.length,
      region: region ? {
        code: region.code,
        name: region.name,
        currency: region.currency,
      } : null,
    }, { headers })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500, headers }
    )
  }
}
