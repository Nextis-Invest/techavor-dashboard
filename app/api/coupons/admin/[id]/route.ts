import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/coupons/admin/[id] - Get single coupon
export const GET = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            order: {
              select: {
                id: true,
                orderNumber: true,
                total: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { usages: true },
        },
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}, "admin")

// PUT /api/coupons/admin/[id] - Update coupon
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumPurchase,
      maximumDiscount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      endDate,
      isActive,
    } = body

    const existing = await prisma.coupon.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    // Check for unique code if changed
    if (code && code.toUpperCase() !== existing.code) {
      const codeConflict = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
      })
      if (codeConflict) {
        return NextResponse.json(
          { error: "Un coupon avec ce code existe deja" },
          { status: 400 }
        )
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase() : existing.code,
        description: description ?? existing.description,
        discountType: discountType ?? existing.discountType,
        discountValue: discountValue ?? existing.discountValue,
        minimumPurchase: minimumPurchase === null ? null : (minimumPurchase ?? existing.minimumPurchase),
        maximumDiscount: maximumDiscount === null ? null : (maximumDiscount ?? existing.maximumDiscount),
        usageLimit: usageLimit === null ? null : (usageLimit ?? existing.usageLimit),
        usageLimitPerUser: usageLimitPerUser ?? existing.usageLimitPerUser,
        startDate: startDate ? new Date(startDate) : (startDate === null ? null : existing.startDate),
        endDate: endDate ? new Date(endDate) : (endDate === null ? null : existing.endDate),
        isActive: isActive ?? existing.isActive,
      },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/coupons/admin/[id] - Delete coupon
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existing = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    // If coupon has been used, just deactivate it
    if (existing._count.usages > 0) {
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        success: true,
        message: "Coupon desactive (a deja ete utilise)",
      })
    }

    // Otherwise, delete it
    await prisma.coupon.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: "Coupon supprime avec succes",
    })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    )
  }
}, "admin")
