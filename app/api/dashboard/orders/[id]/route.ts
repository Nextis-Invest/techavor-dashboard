import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/dashboard/orders/[id] - Get single order
export const GET = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
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
                sku: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
        coupon: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    )
  }
}, "admin")

// PUT /api/dashboard/orders/[id] - Update order
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingPhone,
      shippingEmail,
      trackingNumber,
      notes,
    } = body

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (status) updateData.status = status
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      if (paymentStatus === "PAID" && !existing.paidAt) {
        updateData.paidAt = new Date()
      }
    }
    if (fulfillmentStatus) {
      updateData.fulfillmentStatus = fulfillmentStatus
      if (fulfillmentStatus === "FULFILLED" && !existing.fulfilledAt) {
        updateData.fulfilledAt = new Date()
      }
      if (fulfillmentStatus === "SHIPPED" && !existing.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (fulfillmentStatus === "DELIVERED" && !existing.deliveredAt) {
        updateData.deliveredAt = new Date()
      }
    }
    if (shippingName !== undefined) updateData.shippingName = shippingName
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress
    if (shippingCity !== undefined) updateData.shippingCity = shippingCity
    if (shippingPhone !== undefined) updateData.shippingPhone = shippingPhone
    if (shippingEmail !== undefined) updateData.shippingEmail = shippingEmail
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (notes !== undefined) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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
                sku: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/dashboard/orders/[id] - Cancel/delete order
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Only allow cancellation of pending orders
    if (!["PENDING", "PROCESSING"].includes(existing.status)) {
      return NextResponse.json(
        { error: "Only pending or processing orders can be cancelled" },
        { status: 400 }
      )
    }

    // Soft cancel by updating status
    await prisma.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Commande annulee avec succes",
    })
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    )
  }
}, "admin")
