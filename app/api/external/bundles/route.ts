import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

/**
 * GET /api/external/bundles
 * Returns bundles for external stores
 * Query params:
 *   - id: filter by bundle ID
 *   - productId: filter by parent product ID
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
    const id = searchParams.get("id")
    const productId = searchParams.get("productId")

    // Build where clause
    const where: Record<string, unknown> = {}

    if (id) {
      where.id = id
    }

    if (productId) {
      where.productId = productId
    }

    // Fetch bundles with items and product details
    const bundles = await prisma.productBundle.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            slug: true,
            name: true,
            price: true,
            compareAtPrice: true,
            status: true,
            images: {
              orderBy: { position: "asc" },
              take: 1,
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                price: true,
                compareAtPrice: true,
                images: {
                  orderBy: { position: "asc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform bundles to external format
    const externalBundles = bundles.map((bundle) => ({
      id: bundle.id,
      productId: bundle.productId,
      savingsAmount: bundle.savingsAmount ? Number(bundle.savingsAmount) : null,
      savingsPercent: bundle.savingsPercent ? Number(bundle.savingsPercent) : null,
      product: {
        id: bundle.product.id,
        sku: bundle.product.sku,
        slug: bundle.product.slug,
        name: bundle.product.name,
        price: Number(bundle.product.price),
        compareAtPrice: bundle.product.compareAtPrice ? Number(bundle.product.compareAtPrice) : null,
        isActive: bundle.product.status === "ACTIVE",
        image: bundle.product.images[0]?.url || null,
      },
      items: bundle.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        individualPrice: item.individualPrice ? Number(item.individualPrice) : null,
        position: item.position,
        product: {
          id: item.product.id,
          sku: item.product.sku,
          slug: item.product.slug,
          name: item.product.name,
          price: Number(item.product.price),
          compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
          image: item.product.images[0]?.url || null,
        },
      })),
      createdAt: bundle.createdAt.toISOString(),
      updatedAt: bundle.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      bundles: externalBundles,
      count: externalBundles.length,
    }, { headers })
  } catch (error) {
    console.error("Error fetching bundles:", error)
    return NextResponse.json(
      { error: "Failed to fetch bundles" },
      { status: 500, headers }
    )
  }
}

/**
 * POST /api/external/bundles
 * Create a new bundle
 */
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "write")) {
    return NextResponse.json(
      { error: "Missing required permission: write" },
      { status: 403, headers }
    )
  }

  try {
    const body = await request.json()
    const { productId, savingsAmount, savingsPercent, items } = body

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400, headers }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400, headers }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers }
      )
    }

    // Check if bundle already exists for this product
    const existingBundle = await prisma.productBundle.findUnique({
      where: { productId },
    })

    if (existingBundle) {
      return NextResponse.json(
        { error: "Bundle already exists for this product" },
        { status: 409, headers }
      )
    }

    // Create bundle with items
    const bundle = await prisma.productBundle.create({
      data: {
        productId,
        savingsAmount: savingsAmount || null,
        savingsPercent: savingsPercent || null,
        items: {
          create: items.map((item: { productId: string; quantity?: number; individualPrice?: number }, index: number) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            individualPrice: item.individualPrice || null,
            position: index,
          })),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      bundle: {
        id: bundle.id,
        productId: bundle.productId,
        product: bundle.product,
        items: bundle.items,
      },
    }, { status: 201, headers })
  } catch (error) {
    console.error("Error creating bundle:", error)
    return NextResponse.json(
      { error: "Failed to create bundle" },
      { status: 500, headers }
    )
  }
}

/**
 * PUT /api/external/bundles
 * Update a bundle
 */
export async function PUT(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "write")) {
    return NextResponse.json(
      { error: "Missing required permission: write" },
      { status: 403, headers }
    )
  }

  try {
    const body = await request.json()
    const { id, savingsAmount, savingsPercent, items } = body

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers }
      )
    }

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id },
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404, headers }
      )
    }

    // Update bundle
    const updateData: Record<string, unknown> = {}

    if (savingsAmount !== undefined) {
      updateData.savingsAmount = savingsAmount
    }

    if (savingsPercent !== undefined) {
      updateData.savingsPercent = savingsPercent
    }

    // If items are provided, replace all items
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.bundleItem.deleteMany({
        where: { bundleId: id },
      })

      // Create new items
      await prisma.bundleItem.createMany({
        data: items.map((item: { productId: string; quantity?: number; individualPrice?: number }, index: number) => ({
          bundleId: id,
          productId: item.productId,
          quantity: item.quantity || 1,
          individualPrice: item.individualPrice || null,
          position: index,
        })),
      })
    }

    const bundle = await prisma.productBundle.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    })

    return NextResponse.json({
      success: true,
      bundle: {
        id: bundle.id,
        productId: bundle.productId,
        savingsAmount: bundle.savingsAmount ? Number(bundle.savingsAmount) : null,
        savingsPercent: bundle.savingsPercent ? Number(bundle.savingsPercent) : null,
        product: bundle.product,
        items: bundle.items,
      },
    }, { headers })
  } catch (error) {
    console.error("Error updating bundle:", error)
    return NextResponse.json(
      { error: "Failed to update bundle" },
      { status: 500, headers }
    )
  }
}

/**
 * DELETE /api/external/bundles
 * Delete a bundle
 */
export async function DELETE(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  if (!hasPermission(validation.apiKey!.permissions, "write")) {
    return NextResponse.json(
      { error: "Missing required permission: write" },
      { status: 403, headers }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers }
      )
    }

    // Check if bundle exists
    const existingBundle = await prisma.productBundle.findUnique({
      where: { id },
    })

    if (!existingBundle) {
      return NextResponse.json(
        { error: "Bundle not found" },
        { status: 404, headers }
      )
    }

    // Delete bundle (items will cascade delete)
    await prisma.productBundle.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Bundle deleted successfully",
    }, { headers })
  } catch (error) {
    console.error("Error deleting bundle:", error)
    return NextResponse.json(
      { error: "Failed to delete bundle" },
      { status: 500, headers }
    )
  }
}
