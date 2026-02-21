import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/coupons/admin - List all coupons
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const isActive = searchParams.get("isActive")

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true"
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: { usages: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ])

    return NextResponse.json({
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}, "admin")

// POST /api/coupons/admin - Create coupon
export const POST = withAuth(async (req: NextRequest) => {
  try {
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

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Code, discount type, and discount value are required" },
        { status: 400 }
      )
    }

    // Check for unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Un coupon avec ce code existe deja" },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minimumPurchase: minimumPurchase || null,
        maximumDiscount: maximumDiscount || null,
        usageLimit: usageLimit || null,
        usageLimitPerUser: usageLimitPerUser || 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    )
  }
}, "admin")
