import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/inventory - List inventory with product info
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const warehouseId = searchParams.get("warehouseId") || ""
    const lowStock = searchParams.get("lowStock") === "true"

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: "insensitive" } } },
        { product: { sku: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (warehouseId) {
      where.warehouseId = warehouseId
    }

    if (lowStock) {
      where.quantity = { lte: prisma.inventory.fields.lowStockThreshold }
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              status: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ])

    // Calculate low stock items
    const lowStockItems = inventory.filter(
      (inv) => inv.quantity <= inv.lowStockThreshold
    )

    return NextResponse.json({
      inventory,
      lowStockCount: lowStockItems.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}, "admin")
