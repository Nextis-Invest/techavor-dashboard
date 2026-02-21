import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"
import { slugify } from "@/lib/utils"
import { createStripeProduct, updateStripeProduct, archiveStripeProduct } from "@/lib/stripe-sync"

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/products/[id] - Get single product
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { position: "asc" },
        },
        attributes: {
          orderBy: { position: "asc" },
        },
        variants: {
          include: {
            options: true,
            inventory: true,
          },
          orderBy: { position: "asc" },
        },
        inventory: {
          include: { warehouse: true },
        },
        bundle: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: { where: { isPrimary: true }, take: 1 }
                  }
                }
              },
              orderBy: { position: "asc" }
            }
          }
        },
        upsellsFrom: {
          where: { isActive: true },
          include: {
            toProduct: {
              include: {
                images: { where: { isPrimary: true }, take: 1 }
              }
            }
          },
          orderBy: { priority: "asc" }
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product (admin only)
export const PUT = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      costPrice,
      categoryId,
      status,
      featured,
      trending,
      newArrival,
      bestSeller,
      taxable,
      taxRate,
      weight,
      weightUnit,
      metaTitle,
      metaDescription,
      images,
      attributes,
    } = body

    const existing = await prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Generate new slug if name changed
    let slug = existing.slug
    if (name && name !== existing.name) {
      slug = slugify(name)
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      })
      if (slugConflict) {
        slug = `${slug}-${Date.now()}`
      }
    }

    // Handle publishedAt based on status change
    let publishedAt = existing.publishedAt
    if (status === "ACTIVE" && !existing.publishedAt) {
      publishedAt = new Date()
    } else if (status !== "ACTIVE") {
      publishedAt = null
    }

    // Update images if provided
    if (images) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, index: number) => ({
            productId: id,
            url: img.url,
            altText: img.altText || name || existing.name,
            position: index,
            isPrimary: index === 0,
          })),
        })
      }
    }

    // Update attributes if provided
    if (attributes) {
      await prisma.productAttribute.deleteMany({ where: { productId: id } })
      if (attributes.length > 0) {
        await prisma.productAttribute.createMany({
          data: attributes.map((attr: any, index: number) => ({
            productId: id,
            name: attr.name,
            value: attr.value,
            displayName: attr.displayName,
            position: index,
          })),
        })
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug,
        description: description ?? existing.description,
        shortDescription: shortDescription ?? existing.shortDescription,
        price: price ?? existing.price,
        compareAtPrice: compareAtPrice === null ? null : (compareAtPrice ?? existing.compareAtPrice),
        costPrice: costPrice === null ? null : (costPrice ?? existing.costPrice),
        categoryId: categoryId ?? existing.categoryId,
        status: status ?? existing.status,
        featured: featured ?? existing.featured,
        trending: trending ?? existing.trending,
        newArrival: newArrival ?? existing.newArrival,
        bestSeller: bestSeller ?? existing.bestSeller,
        taxable: taxable ?? existing.taxable,
        taxRate: taxRate ?? existing.taxRate,
        weight: weight === null ? null : (weight ?? existing.weight),
        weightUnit: weightUnit ?? existing.weightUnit,
        metaTitle: metaTitle ?? existing.metaTitle,
        metaDescription: metaDescription ?? existing.metaDescription,
        publishedAt,
      },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        attributes: { orderBy: { position: "asc" } },
        variants: { include: { options: true } },
      },
    })

    // Sync to Stripe
    const finalStatus = status ?? existing.status
    if (finalStatus === "ACTIVE") {
      const stripeResult = existing.stripeProductId
        ? await updateStripeProduct({
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            images: product.images.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
            stripeProductId: existing.stripeProductId,
            stripePriceId: existing.stripePriceId,
          })
        : await createStripeProduct({
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            images: product.images.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
          })

      if (stripeResult.success && (stripeResult.stripeProductId || stripeResult.stripePriceId)) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stripeProductId: stripeResult.stripeProductId || existing.stripeProductId,
            stripePriceId: stripeResult.stripePriceId || existing.stripePriceId,
          },
        })
      }
    } else if (finalStatus !== "ACTIVE" && existing.stripeProductId) {
      // Archive on Stripe if status changed from ACTIVE
      await archiveStripeProduct(existing.stripeProductId)
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    )
  }
}, "admin")

// DELETE /api/products/[id] - Delete product (admin only)
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    // Archive on Stripe first
    if (existing.stripeProductId) {
      await archiveStripeProduct(existing.stripeProductId)
    }

    // Check if product has orders
    if (existing._count.orderItems > 0) {
      // Soft delete by archiving
      await prisma.product.update({
        where: { id },
        data: { status: "ARCHIVED" },
      })
      return NextResponse.json({
        success: true,
        message: "Product archived (has existing orders)",
      })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    )
  }
}, "admin")
