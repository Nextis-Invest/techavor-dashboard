import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/products/upsells/[id] - Get single upsell relationship
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const upsell = await prisma.productUpsell.findUnique({
      where: { id },
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

    if (!upsell) {
      return NextResponse.json(
        { error: "Upsell not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ upsell })
  } catch (error) {
    console.error("Error fetching upsell:", error)
    return NextResponse.json(
      { error: "Failed to fetch upsell" },
      { status: 500 }
    )
  }
}

// PUT /api/products/upsells/[id] - Update upsell relationship (admin only)
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { type, discount, message, isActive, position } = body

    const existingUpsell = await prisma.productUpsell.findUnique({
      where: { id },
    })

    if (!existingUpsell) {
      return NextResponse.json(
        { error: "Upsell not found" },
        { status: 404 }
      )
    }

    const upsell = await prisma.productUpsell.update({
      where: { id },
      data: {
        type: type ?? existingUpsell.type,
        discount: discount !== undefined ? discount : existingUpsell.discount,
        message: message !== undefined ? message : existingUpsell.message,
        isActive: isActive !== undefined ? isActive : existingUpsell.isActive,
        position: position !== undefined ? position : existingUpsell.position,
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

    return NextResponse.json({ upsell })
  } catch (error) {
    console.error("Error updating upsell:", error)
    return NextResponse.json(
      { error: "Failed to update upsell" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/products/upsells/[id] - Delete upsell relationship (admin only)
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existingUpsell = await prisma.productUpsell.findUnique({
      where: { id },
    })

    if (!existingUpsell) {
      return NextResponse.json(
        { error: "Upsell not found" },
        { status: 404 }
      )
    }

    await prisma.productUpsell.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting upsell:", error)
    return NextResponse.json(
      { error: "Failed to delete upsell" },
      { status: 500 }
    )
  }
}, "admin")
