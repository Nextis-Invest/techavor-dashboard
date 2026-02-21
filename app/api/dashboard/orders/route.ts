import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"
import { generateOrderNumber } from "@/lib/utils"

// GET /api/dashboard/orders - List orders with filters
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const paymentStatus = searchParams.get("paymentStatus") || ""
    const fulfillmentStatus = searchParams.get("fulfillmentStatus") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { shippingPhone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    if (fulfillmentStatus) {
      where.fulfillmentStatus = fulfillmentStatus
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}, "admin")

// POST /api/dashboard/orders - Create order (admin)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const {
      userId,
      items,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingPhone,
      shippingEmail,
      notes,
      subtotal,
      shippingCost,
      taxAmount,
      discountAmount,
      total,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      )
    }

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        status: "PENDING",
        paymentStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
        paymentMethod: "CASH",
        subtotal: subtotal || 0,
        shippingCost: shippingCost || 0,
        taxAmount: taxAmount || 0,
        discountAmount: discountAmount || 0,
        total: total || 0,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingPhone,
        shippingEmail,
        notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            productName: item.productName,
            variantName: item.variantName || null,
            sku: item.sku || null,
          })),
        },
      },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}, "admin")
