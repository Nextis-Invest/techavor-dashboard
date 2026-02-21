import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

/**
 * GET /api/external/coupons
 * Returns active coupons for external stores
 * Query params:
 *   - code: validate specific coupon code
 *   - active: get best active coupon (for promo display)
 *   - all: get all active coupons
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
    const code = searchParams.get("code")
    const getActive = searchParams.get("active") === "true"
    const getAll = searchParams.get("all") === "true"

    const now = new Date()

    // Base where clause for active coupons
    const baseWhere = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
      AND: [
        {
          OR: [
            { startsAt: null },
            { startsAt: { lte: now } },
          ],
        },
      ],
    }

    // Single coupon by code
    if (code) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          ...baseWhere,
          code: code.toUpperCase(),
        },
      })

      if (!coupon) {
        return NextResponse.json({
          success: false,
          error: "Coupon not found or expired",
        }, { status: 404, headers })
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({
          success: false,
          error: "Coupon usage limit reached",
        }, { status: 400, headers })
      }

      return NextResponse.json({
        success: true,
        coupon: transformCoupon(coupon),
      }, { headers })
    }

    // Get best active coupon (highest discount percentage)
    if (getActive) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          ...baseWhere,
          type: "PERCENTAGE", // Only percentage discounts for display
        },
        orderBy: {
          value: "desc", // Highest discount first
        },
      })

      if (!coupon) {
        return NextResponse.json({
          success: true,
          coupon: null,
        }, { headers })
      }

      return NextResponse.json({
        success: true,
        coupon: transformCoupon(coupon),
      }, { headers })
    }

    // Get all active coupons
    if (getAll) {
      const coupons = await prisma.coupon.findMany({
        where: baseWhere,
        orderBy: {
          value: "desc",
        },
      })

      return NextResponse.json({
        success: true,
        coupons: coupons.map(transformCoupon),
        count: coupons.length,
      }, { headers })
    }

    // Default: return best active coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        ...baseWhere,
        type: "PERCENTAGE",
      },
      orderBy: {
        value: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      coupon: coupon ? transformCoupon(coupon) : null,
    }, { headers })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500, headers }
    )
  }
}

// Transform coupon to external format (compatible with landing page PromoCodeData)
function transformCoupon(coupon: {
  id: string
  code: string
  description: string | null
  type: string
  value: { toNumber?: () => number } | number
  maxDiscount: { toNumber?: () => number } | number | null
  minPurchase: { toNumber?: () => number } | number | null
  expiresAt: Date | null
  applicableProducts: unknown
  applicableCategories: unknown
}) {
  // Handle Decimal type from Prisma
  const getValue = (val: { toNumber?: () => number } | number | null): number | null => {
    if (val === null) return null
    if (typeof val === "number") return val
    if (typeof val?.toNumber === "function") return val.toNumber()
    return Number(val)
  }

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    // Map to landing page format
    discount: coupon.type === "PERCENTAGE" ? getValue(coupon.value) : 0,
    discountType: coupon.type,
    discountValue: getValue(coupon.value),
    maxSavings: getValue(coupon.maxDiscount),
    minPurchase: getValue(coupon.minPurchase),
    expiresAt: coupon.expiresAt,
    validFor: extractValidFor(coupon.applicableProducts, coupon.applicableCategories),
  }
}

// Extract validFor array from applicable products/categories
function extractValidFor(
  products: unknown,
  categories: unknown
): string[] {
  const validFor: string[] = []

  if (!products && !categories) {
    return ["all"]
  }

  if (Array.isArray(products) && products.length > 0) {
    validFor.push(...products.map(String))
  }

  if (Array.isArray(categories) && categories.length > 0) {
    validFor.push(...categories.map(String))
  }

  return validFor.length > 0 ? validFor : ["all"]
}
