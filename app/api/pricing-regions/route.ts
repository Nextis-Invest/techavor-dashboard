import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/pricing-regions - List all pricing regions
export async function GET() {
  try {
    const regions = await prisma.pricingRegion.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { prices: true },
        },
      },
    })

    return NextResponse.json({ regions })
  } catch (error) {
    console.error("Error fetching pricing regions:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing regions" },
      { status: 500 }
    )
  }
}

// POST /api/pricing-regions - Create new pricing region (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { code, name, currency, countries, isDefault, sortOrder } = body

    if (!code || !name || !currency) {
      return NextResponse.json(
        { error: "Code, name, and currency are required" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.pricingRegion.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A region with this code already exists" },
        { status: 400 }
      )
    }

    // If this region is being set as default, unset other defaults
    if (isDefault) {
      await prisma.pricingRegion.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const region = await prisma.pricingRegion.create({
      data: {
        code: code.toUpperCase(),
        name,
        currency: currency.toUpperCase(),
        countries: countries ?? [],
        isDefault: isDefault ?? false,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ region }, { status: 201 })
  } catch (error) {
    console.error("Error creating pricing region:", error)
    return NextResponse.json(
      { error: "Failed to create pricing region" },
      { status: 500 }
    )
  }
}, "admin")
