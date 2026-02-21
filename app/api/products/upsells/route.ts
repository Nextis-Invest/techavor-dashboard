import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/products/upsells - List all upsell relationships
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get("productId")
    const type = searchParams.get("type")

    const where: any = {}

    if (productId) {
      where.OR = [
        { fromProductId: productId },
        { toProductId: productId },
      ]
    }

    if (type) {
      where.type = type
    }

    const upsells = await prisma.productUpsell.findMany({
      where,
      include: {
        fromProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            bundle: {
              include: {
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, price: true },
                    },
                  },
                },
              },
            },
          },
        },
        toProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            bundle: {
              include: {
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, price: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ upsells })
  } catch (error) {
    console.error("Error fetching upsells:", error)
    return NextResponse.json(
      { error: "Failed to fetch upsells" },
      { status: 500 }
    )
  }
}

// POST /api/products/upsells - Create new upsell relationship (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { fromProductId, toProductId, type, discount, message, isActive } = body

    if (!fromProductId || !toProductId) {
      return NextResponse.json(
        { error: "fromProductId and toProductId are required" },
        { status: 400 }
      )
    }

    if (fromProductId === toProductId) {
      return NextResponse.json(
        { error: "A product cannot be an upsell of itself" },
        { status: 400 }
      )
    }

    // Check if products exist
    const [fromProduct, toProduct] = await Promise.all([
      prisma.product.findUnique({ where: { id: fromProductId } }),
      prisma.product.findUnique({ where: { id: toProductId } }),
    ])

    if (!fromProduct || !toProduct) {
      return NextResponse.json(
        { error: "One or both products not found" },
        { status: 404 }
      )
    }

    // Check if relationship already exists
    const existingUpsell = await prisma.productUpsell.findFirst({
      where: {
        fromProductId,
        toProductId,
        type: type || "UPSELL",
      },
    })

    if (existingUpsell) {
      return NextResponse.json(
        { error: "This upsell relationship already exists" },
        { status: 400 }
      )
    }

    const upsell = await prisma.productUpsell.create({
      data: {
        fromProductId,
        toProductId,
        type: type || "UPSELL",
        discount: discount || null,
        message: message || null,
        isActive: isActive ?? true,
      },
      include: {
        fromProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            bundle: {
              include: {
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, price: true },
                    },
                  },
                },
              },
            },
          },
        },
        toProduct: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            bundle: {
              include: {
                items: {
                  include: {
                    product: {
                      select: { id: true, name: true, sku: true, price: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ upsell }, { status: 201 })
  } catch (error) {
    console.error("Error creating upsell:", error)
    return NextResponse.json(
      { error: "Failed to create upsell" },
      { status: 500 }
    )
  }
}, "admin")
