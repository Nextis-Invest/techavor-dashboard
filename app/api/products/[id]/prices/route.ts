import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/products/[id]/prices - Get all regional prices for a product
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, compareAtPrice: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Get all regions with their prices for this product
    const regions = await prisma.pricingRegion.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        prices: {
          where: { productId: id },
        },
      },
    })

    // Format response to include region with its price (or null if not set)
    // Convert Prisma Decimal types to numbers
    const regionalPrices = regions.map((region) => ({
      regionId: region.id,
      regionCode: region.code,
      regionName: region.name,
      currency: region.currency,
      isDefault: region.isDefault,
      price: region.prices[0]?.price ? Number(region.prices[0].price) : null,
      compareAtPrice: region.prices[0]?.compareAtPrice ? Number(region.prices[0].compareAtPrice) : null,
    }))

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        basePrice: Number(product.price),
        baseCompareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      },
      regionalPrices,
    })
  } catch (error) {
    console.error("Error fetching product regional prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch regional prices" },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id]/prices - Bulk update regional prices (admin only)
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { prices } = body

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    if (!prices || !Array.isArray(prices)) {
      return NextResponse.json(
        { error: "Prices array is required" },
        { status: 400 }
      )
    }

    // Process each price update
    const results = await Promise.all(
      prices.map(async (priceData: {
        regionId: string
        price: number | null
        compareAtPrice?: number | null
      }) => {
        const { regionId, price, compareAtPrice } = priceData

        // Verify region exists
        const region = await prisma.pricingRegion.findUnique({
          where: { id: regionId },
        })

        if (!region) {
          return { regionId, success: false, error: "Region not found" }
        }

        // If price is null, delete the regional price (use base price)
        if (price === null) {
          await prisma.productRegionPrice.deleteMany({
            where: {
              productId: id,
              regionId,
            },
          })
          return { regionId, success: true, action: "deleted" }
        }

        // Upsert the regional price
        await prisma.productRegionPrice.upsert({
          where: {
            productId_regionId: {
              productId: id,
              regionId,
            },
          },
          update: {
            price,
            compareAtPrice: compareAtPrice ?? null,
          },
          create: {
            productId: id,
            regionId,
            price,
            compareAtPrice: compareAtPrice ?? null,
          },
        })

        return { regionId, success: true, action: "updated" }
      })
    )

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Error updating product regional prices:", error)
    return NextResponse.json(
      { error: "Failed to update regional prices" },
      { status: 500 }
    )
  }
}, "admin")
