import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/pricing-regions/[id] - Get single pricing region
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const region = await prisma.pricingRegion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prices: true },
        },
      },
    })

    if (!region) {
      return NextResponse.json(
        { error: "Pricing region not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ region })
  } catch (error) {
    console.error("Error fetching pricing region:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing region" },
      { status: 500 }
    )
  }
}

// PUT /api/pricing-regions/[id] - Update pricing region (admin only)
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { code, name, currency, countries, isDefault, sortOrder } = body

    const existing = await prisma.pricingRegion.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Pricing region not found" },
        { status: 404 }
      )
    }

    // Check if new code conflicts with another region
    if (code && code !== existing.code) {
      const codeConflict = await prisma.pricingRegion.findFirst({
        where: {
          code: code.toUpperCase(),
          id: { not: id },
        },
      })

      if (codeConflict) {
        return NextResponse.json(
          { error: "A region with this code already exists" },
          { status: 400 }
        )
      }
    }

    // If this region is being set as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.pricingRegion.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const region = await prisma.pricingRegion.update({
      where: { id },
      data: {
        code: code ? code.toUpperCase() : existing.code,
        name: name ?? existing.name,
        currency: currency ? currency.toUpperCase() : existing.currency,
        countries: countries ?? existing.countries,
        isDefault: isDefault ?? existing.isDefault,
        sortOrder: sortOrder ?? existing.sortOrder,
      },
    })

    return NextResponse.json({ region })
  } catch (error) {
    console.error("Error updating pricing region:", error)
    return NextResponse.json(
      { error: "Failed to update pricing region" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/pricing-regions/[id] - Delete pricing region (admin only)
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existing = await prisma.pricingRegion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prices: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Pricing region not found" },
        { status: 404 }
      )
    }

    // Prevent deletion of the default region
    if (existing.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete the default pricing region" },
        { status: 400 }
      )
    }

    // Delete all associated prices first (cascade should handle this but being explicit)
    await prisma.productRegionPrice.deleteMany({
      where: { regionId: id },
    })

    await prisma.pricingRegion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting pricing region:", error)
    return NextResponse.json(
      { error: "Failed to delete pricing region" },
      { status: 500 }
    )
  }
}, "admin")
