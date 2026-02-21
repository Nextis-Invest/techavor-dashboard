import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey, hasPermission, corsHeaders } from "@/lib/api-auth"
import { generateAutoblogArticle } from "@/lib/ai-services"
import { uploadBase64Image } from "@/lib/storage"

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

/**
 * POST /api/external/articles/generate/batch
 * Generate multiple articles using AI
 *
 * Body:
 *   - topics: string[] (required) - List of topics to write about
 *   - category: string (optional) - Default category for all articles
 *   - locale: string (optional) - Language locale (default: "en")
 *   - generateImages: boolean (optional) - Generate cover images (default: true)
 *   - imageStyle: string (optional) - Image style for all articles
 *   - tone: string (optional) - Writing tone for all articles
 *   - length: string (optional) - Article length for all articles
 *   - autoPublish: boolean (optional) - Publish immediately (default: false)
 *   - delayBetweenMs: number (optional) - Delay between generations (default: 2000)
 */
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin") || undefined)

  // Validate API key
  const validation = await validateApiKey(request)

  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401, headers }
    )
  }

  // Require admin permission for batch operations
  if (!hasPermission(validation.apiKey!.permissions, "admin")) {
    return NextResponse.json(
      { error: "Missing required permission: admin (batch operations require admin access)" },
      { status: 403, headers }
    )
  }

  try {
    const body = await request.json()
    const {
      topics,
      category,
      locale = "en",
      generateImages = true,
      imageStyle = "digital-art",
      tone = "professional",
      length = "medium",
      autoPublish = false,
      delayBetweenMs = 2000,
    } = body

    // Validate required fields
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: "Topics array is required and must not be empty" },
        { status: 400, headers }
      )
    }

    // Limit batch size
    if (topics.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 topics per batch" },
        { status: 400, headers }
      )
    }

    const results: Array<{
      topic: string
      success: boolean
      articleId?: string
      slug?: string
      title?: string
      error?: string
    }> = []

    // Process each topic
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]

      try {
        // Generate the article
        const result = await generateAutoblogArticle({
          topic,
          category,
          locale,
          generateImage: generateImages,
          imageStyle,
          tone,
          length,
        })

        if (!result.success || !result.article) {
          results.push({
            topic,
            success: false,
            error: result.error || "Failed to generate article",
          })
          continue
        }

        // Upload cover image if generated
        let coverImageUrl: string | null = null
        if (result.article.coverImage) {
          try {
            const uploadResult = await uploadBase64Image(
              result.article.coverImage,
              result.article.coverImageMimeType || "image/png",
              `articles/${Date.now()}-cover`
            )
            if (uploadResult.success) {
              coverImageUrl = uploadResult.url
            }
          } catch (error) {
            console.error("Failed to upload cover image:", error)
          }
        }

        // Generate unique slug
        const baseSlug = generateSlug(result.article.title)
        const existingArticle = await prisma.article.findUnique({
          where: { slug: baseSlug },
        })
        const slug = existingArticle
          ? `${baseSlug}-${Date.now().toString(36)}`
          : baseSlug

        // Calculate reading time
        const wordCount = result.article.content.split(/\s+/).length
        const readingTime = Math.max(1, Math.ceil(wordCount / 200))

        // Create the article
        const article = await prisma.article.create({
          data: {
            title: result.article.title,
            slug,
            excerpt: result.article.excerpt,
            content: result.article.content,
            coverImage: coverImageUrl,
            author: "Techavor AI",
            category: result.article.category,
            tags: result.article.tags,
            status: autoPublish ? "PUBLISHED" : "DRAFT",
            publishedAt: autoPublish ? new Date() : null,
            locale,
            seoTitle: result.article.seoTitle,
            seoDescription: result.article.seoDescription,
            readingTime,
            isAutogenerated: true,
            sourceType: "ai-generated",
          },
        })

        results.push({
          topic,
          success: true,
          articleId: article.id,
          slug: article.slug,
          title: article.title,
        })
      } catch (error) {
        results.push({
          topic,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }

      // Add delay between generations (except for last item)
      if (i < topics.length - 1 && delayBetweenMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenMs))
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: failureCount === 0,
      results,
      summary: {
        total: topics.length,
        successful: successCount,
        failed: failureCount,
      },
    }, { status: 201, headers })
  } catch (error) {
    console.error("Error in batch generation:", error)
    return NextResponse.json(
      { error: "Failed to process batch generation" },
      { status: 500, headers }
    )
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .substring(0, 100)
}
