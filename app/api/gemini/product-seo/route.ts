import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { geminiService, createConfigFromEnv } from '@/modules/gemini'
import type { GeminiConfig } from '@/modules/gemini'

// Validation schema
const ProductSEORequestSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  productDescription: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  targetLanguage: z.enum(['en', 'fr', 'es', 'de', 'ar', 'nl']).optional().default('en'),
  tone: z.enum(['professional', 'casual', 'luxury', 'technical']).optional().default('professional'),
})

// POST /api/gemini/product-seo - Generate SEO for a product
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin privileges
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = ProductSEORequestSchema.parse(body)

    // Try to get config from database first, fallback to environment
    let config: GeminiConfig | null = null

    try {
      const dbConfig = await prisma.geminiConfig.findFirst({
        where: { isActive: true },
      })

      if (dbConfig) {
        config = {
          id: dbConfig.id,
          name: dbConfig.name,
          description: dbConfig.description || undefined,
          apiKey: dbConfig.apiKey,
          model: dbConfig.model,
          temperature: dbConfig.temperature ? Number(dbConfig.temperature) : 0.7,
          maxTokens: dbConfig.maxTokens || 2048,
          topP: dbConfig.topP ? Number(dbConfig.topP) : 0.9,
          topK: dbConfig.topK || 40,
          candidateCount: dbConfig.candidateCount || 1,
          stopSequences: dbConfig.stopSequences || undefined,
          presencePenalty: dbConfig.presencePenalty ? Number(dbConfig.presencePenalty) : 0,
          frequencyPenalty: dbConfig.frequencyPenalty ? Number(dbConfig.frequencyPenalty) : 0,
          seed: dbConfig.seed || undefined,
          responseFormat: dbConfig.responseFormat || 'text',
          enabledTasks: dbConfig.enabledTasks as GeminiConfig['enabledTasks'],
          usageContext: dbConfig.usageContext as GeminiConfig['usageContext'],
          isActive: dbConfig.isActive || false,
          rateLimitPerMinute: dbConfig.rateLimitPerMinute || 60,
          rateLimitPerHour: dbConfig.rateLimitPerHour || 1000,
          dailyQuota: dbConfig.dailyQuota || 10000,
          safetySettings: (dbConfig.safetySettings as Record<string, unknown>) || {},
          systemInstruction: dbConfig.systemInstruction || undefined,
          customHeaders: (dbConfig.customHeaders as Record<string, string>) || {},
          timeoutMs: dbConfig.timeoutMs || 30000,
          retryAttempts: dbConfig.retryAttempts || 3,
          createdAt: dbConfig.createdAt,
          updatedAt: dbConfig.updatedAt,
          createdBy: dbConfig.createdBy || undefined,
        }
      }
    } catch {
      // Database config not available, will use env config
    }

    // Fallback to environment config
    if (!config) {
      config = createConfigFromEnv()
    }

    if (!config) {
      return NextResponse.json(
        { error: 'No Gemini configuration found. Set GEMINI_API_KEY in environment or create a config in database.' },
        { status: 400 }
      )
    }

    // Generate SEO
    const result = await geminiService.generateProductSEO(config, {
      productName: validatedData.productName,
      productDescription: validatedData.productDescription,
      category: validatedData.category,
      keywords: validatedData.keywords,
      targetLanguage: validatedData.targetLanguage,
      tone: validatedData.tone,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to generate SEO' }, { status: 500 })
    }

    // Log usage if we have a database config
    if (config.id) {
      try {
        await prisma.geminiUsageLog.create({
          data: {
            configId: config.id,
            taskType: 'PRODUCT_SEO',
            usageContext: 'PRODUCT_MANAGEMENT',
            userId: user.id,
            requestTokens: result.metadata?.tokensUsed ? Math.floor(result.metadata.tokensUsed / 2) : null,
            responseTokens: result.metadata?.tokensUsed ? Math.ceil(result.metadata.tokensUsed / 2) : null,
            totalTokens: result.metadata?.tokensUsed || null,
            costUsd: result.metadata?.tokensUsed
              ? geminiService.calculateCost(result.metadata.tokensUsed, config.model as string)
              : null,
            modelUsed: config.model as 'GEMINI_2_5_FLASH',
            temperatureUsed: config.temperature,
            responseTimeMs: result.metadata?.responseTime || null,
            success: true,
            cacheHit: result.metadata?.cached || false,
          },
        })
      } catch {
        // Log error but don't fail the request
        console.error('Failed to log Gemini usage')
      }
    }

    return NextResponse.json({
      success: true,
      seoTitle: result.seoTitle,
      seoDescription: result.seoDescription,
      keywords: result.keywords,
      metadata: result.metadata,
    })
  } catch (error: unknown) {
    console.error('Error generating product SEO:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }

    const err = error as Error
    return NextResponse.json({ error: 'Failed to generate product SEO', details: err.message }, { status: 500 })
  }
}
