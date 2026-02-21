import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"
import { slugify } from "@/lib/utils"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/categories/[id] - Get single category
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error fetching category:", error)
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category (admin only)
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, image, icon, parentId, position, isActive } = body

    const existing = await prisma.category.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let slug = existing.slug
    if (name && name !== existing.name) {
      slug = slugify(name)

      // Check if new slug conflicts with another category
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (slugConflict) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug,
        description: description ?? existing.description,
        image: image ?? existing.image,
        icon: icon ?? existing.icon,
        parentId: parentId === null ? null : (parentId ?? existing.parentId),
        position: position ?? existing.position,
        isActive: isActive ?? existing.isActive,
      },
      include: {
        parent: true,
        children: true,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/categories/[id] - Delete category (admin only)
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    // Check if category has products
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with products" },
        { status: 400 }
      )
    }

    // Check if category has children
    if (existing._count.children > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with subcategories" },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}, "admin")
