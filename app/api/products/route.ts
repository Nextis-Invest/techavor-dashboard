import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/api/auth-middleware"
import { slugify, generateSKU } from "@/lib/utils"
import { createStripeProduct } from "@/lib/stripe-sync"

// GET /api/products - List products with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const categorySlug = searchParams.get("categorySlug") || ""
    const slug = searchParams.get("slug") || ""
    const featured = searchParams.get("featured") === "true"
    const newArrival = searchParams.get("newArrival") === "true"
    const bestSeller = searchParams.get("bestSeller") === "true"
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (slug) {
      where.slug = slug
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (categorySlug) {
      where.category = {
        slug: categorySlug
      }
    }

    if (featured) {
      where.featured = true
    }

    if (newArrival) {
      where.newArrival = true
    }

    if (bestSeller) {
      where.bestSeller = true
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          bundle: {
            include: {
              items: {
                include: {
                  product: {
                    select: { id: true, name: true, sku: true, price: true }
                  }
                },
                orderBy: { position: "asc" }
              }
            }
          },
          _count: {
            select: { variants: true, orderItems: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product (admin only)
export const POST = withAuth(async (req: NextRequest) => {
  try {
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
      variants,
    } = body

    if (!name || !categoryId || price === undefined) {
      return NextResponse.json(
        { error: "Name, category, and price are required" },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = slugify(name)
    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Generate unique SKU
    let sku = generateSKU("PRD")
    const existingSku = await prisma.product.findUnique({ where: { sku } })
    if (existingSku) {
      sku = generateSKU("PRD")
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        description: description || "",
        shortDescription,
        price,
        compareAtPrice,
        costPrice,
        categoryId,
        status: status || "DRAFT",
        featured: featured || false,
        trending: trending || false,
        newArrival: newArrival || false,
        bestSeller: bestSeller || false,
        taxable: taxable ?? true,
        taxRate: taxRate || 0,
        weight,
        weightUnit: weightUnit || "g",
        metaTitle,
        metaDescription,
        publishedAt: status === "ACTIVE" ? new Date() : null,
        images: images?.length
          ? {
              create: images.map((img: any, index: number) => ({
                url: img.url,
                altText: img.altText || name,
                position: index,
                isPrimary: index === 0,
              })),
            }
          : undefined,
        attributes: attributes?.length
          ? {
              create: attributes.map((attr: any, index: number) => ({
                name: attr.name,
                value: attr.value,
                displayName: attr.displayName,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
        attributes: true,
        variants: true,
      },
    })

    // Sync to Stripe if product is ACTIVE
    if (product.status === "ACTIVE") {
      const stripeResult = await createStripeProduct({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        images: product.images.map(img => ({ url: img.url, isPrimary: img.isPrimary })),
      })

      if (stripeResult.success) {
        // Update product with Stripe IDs
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stripeProductId: stripeResult.stripeProductId,
            stripePriceId: stripeResult.stripePriceId,
          },
        })
        product.stripeProductId = stripeResult.stripeProductId || null
        product.stripePriceId = stripeResult.stripePriceId || null
      }
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}, "admin")
