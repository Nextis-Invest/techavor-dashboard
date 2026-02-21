import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"
import { slugify } from "@/lib/utils"

// GET /api/categories - List all categories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeProducts = searchParams.get("includeProducts") === "true"
    const activeOnly = searchParams.get("activeOnly") === "true"

    const categories = await prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        parent: true,
        children: true,
        _count: includeProducts ? { select: { products: true } } : undefined,
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, description, image, icon, parentId, position, isActive } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        icon,
        parentId,
        position: position ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}, "admin")
