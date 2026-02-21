import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"

// GET /api/warehouses - List warehouses
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    const where: any = {}
    if (activeOnly) {
      where.isActive = true
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { inventory: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    })

    return NextResponse.json({ warehouses })
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    )
  }
}, "admin")

// POST /api/warehouses - Create warehouse
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, code, address, city, phone, email, isDefault } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      )
    }

    // Check for unique code
    const existing = await prisma.warehouse.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: "Un entrepot avec ce code existe deja" },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        city,
        phone,
        email,
        isDefault: isDefault || false,
        isActive: true,
      },
    })

    return NextResponse.json({ warehouse }, { status: 201 })
  } catch (error) {
    console.error("Error creating warehouse:", error)
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    )
  }
}, "admin")
