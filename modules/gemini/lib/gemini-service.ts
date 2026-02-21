/**
 * Gemini AI Service for SEO Generation
 * Provides product and category SEO title/description generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as crypto from 'crypto'
import type {
  GeminiConfig,
  GeminiTaskType,
  GeminiUsageContext,
  GeminiGenerationConfig,
  ProductSEORequest,
  ProductSEOResult,
  CategorySEORequest,
  CategorySEOResult,
  BatchSEORequest,
  BatchSEOResult,
} from '../types'
import { GeminiAPIError } from '../types'

// Model name mapping from config enum to Gemini API model names
const MODEL_NAME_MAP: Record<string, string> = {
  GEMINI_FLASH_LATEST: 'gemini-flash-latest',
  GEMINI_PRO_LATEST: 'gemini-pro-latest',
  GEMINI_2_5_PRO: 'gemini-2.5-pro',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_2_5_FLASH_LITE: 'gemini-2.5-flash-lite',
  GEMINI_2_0_FLASH: 'gemini-2.0-flash',
  GEMINI_2_0_FLASH_LITE: 'gemini-2.0-flash-lite',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_PRO: 'gemini-pro',
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  ar: 'Arabic',
  nl: 'Dutch',
  it: 'Italian',
  pt: 'Portuguese',
}

export class GeminiService {
  private static instance: GeminiService
  private cache = new Map<string, { data: unknown; expiresAt: Date }>()

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService()
    }
    return GeminiService.instance
  }

  private generateRequestHash(prompt: string, config: Partial<GeminiConfig>): string {
    const data = { prompt, model: config.model, temperature: config.temperature }
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
  }

  private getModelName(model: string): string {
    return MODEL_NAME_MAP[model] || model.toLowerCase().replace(/_/g, '-')
  }

  calculateCost(tokens: number, model: string): number {
    const costs: Record<string, number> = {
      GEMINI_FLASH_LATEST: 0.000075,
      GEMINI_2_5_FLASH: 0.000075,
      GEMINI_2_5_PRO: 0.0035,
      GEMINI_1_5_FLASH: 0.000075,
      GEMINI_1_5_PRO: 0.0035,
      GEMINI_PRO: 0.0025,
    }
    const costPerToken = (costs[model] || 0.001) / 1000
    return Number((tokens * costPerToken).toFixed(6))
  }

  /**
   * Core content generation method
   */
  async generateContent(
    config: GeminiConfig,
    prompt: string,
    taskType: GeminiTaskType,
    usageContext: GeminiUsageContext,
    options: {
      systemInstruction?: string
      useCache?: boolean
      customGenerationConfig?: Partial<GeminiGenerationConfig>
    } = {}
  ): Promise<{ text: string; metadata: { cached: boolean; responseTime: number; tokensUsed: number; model: string } }> {
    const startTime = Date.now()

    try {
      // Check cache first
      if (options.useCache !== false) {
        const requestHash = this.generateRequestHash(prompt, config)
        const cached = this.cache.get(requestHash)
        if (cached && cached.expiresAt > new Date()) {
          return {
            text: (cached.data as { text: string }).text,
            metadata: {
              cached: true,
              responseTime: Date.now() - startTime,
              tokensUsed: (cached.data as { tokensUsed: number }).tokensUsed,
              model: config.model as string,
            },
          }
        }
      }

      // Initialize Gemini API
      const genAI = new GoogleGenerativeAI(config.apiKey)
      const modelName = this.getModelName(config.model as string)

      const safetySettings = Array.isArray(config.safetySettings) && config.safetySettings.length > 0
        ? config.safetySettings
        : undefined

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options.customGenerationConfig?.temperature ?? config.temperature,
          maxOutputTokens: options.customGenerationConfig?.maxOutputTokens ?? config.maxTokens,
          topP: options.customGenerationConfig?.topP ?? config.topP,
          topK: options.customGenerationConfig?.topK ?? config.topK,
        },
        ...(safetySettings && { safetySettings }),
      })

      let fullPrompt = prompt
      if (options.systemInstruction || config.systemInstruction) {
        fullPrompt = `${options.systemInstruction || config.systemInstruction}\n\n${prompt}`
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

      try {
        const result = await model.generateContent(fullPrompt)
        const response = result.response
        const text = response.text()

        const tokensUsed = Math.ceil((fullPrompt.length + text.length) / 4)
        const responseTime = Date.now() - startTime

        // Cache the response
        if (options.useCache !== false) {
          const requestHash = this.generateRequestHash(prompt, config)
          this.cache.set(requestHash, {
            data: { text, tokensUsed },
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          })

          if (this.cache.size > 1000) {
            this.cleanExpiredCache()
          }
        }

        return {
          text,
          metadata: {
            cached: false,
            responseTime,
            tokensUsed,
            model: config.model as string,
          },
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error: unknown) {
      const err = error as Error & { name?: string; message?: string }
      if (err.name === 'AbortError') {
        throw new GeminiAPIError('Request timeout', 'TIMEOUT')
      }
      if (err.message?.includes('API_KEY')) {
        throw new GeminiAPIError('Invalid API key', 'INVALID_API_KEY')
      }
      if (err.message?.includes('QUOTA_EXCEEDED')) {
        throw new GeminiAPIError('API quota exceeded', 'QUOTA_EXCEEDED')
      }
      throw new GeminiAPIError('Failed to generate response', 'GENERATION_ERROR', { originalError: err.message })
    }
  }

  /**
   * Generate SEO title and description for a product
   */
  async generateProductSEO(config: GeminiConfig, request: ProductSEORequest): Promise<ProductSEOResult> {
    const startTime = Date.now()

    try {
      const language = LANGUAGE_NAMES[request.targetLanguage || 'en'] || 'English'
      const tone = request.tone || 'professional'

      const systemInstruction = `You are an SEO expert specializing in e-commerce product optimization.
Generate compelling, search-engine-optimized titles and descriptions that drive conversions.
Always respond with valid JSON only, no additional text.`

      const prompt = `Generate an SEO-optimized title and meta description for this product:

Product Name: ${request.productName}
${request.productDescription ? `Description: ${request.productDescription}` : ''}
${request.category ? `Category: ${request.category}` : ''}
${request.keywords?.length ? `Target Keywords: ${request.keywords.join(', ')}` : ''}

Requirements:
- Write in ${language}
- Use a ${tone} tone
- SEO Title: max 60 characters, include primary keyword naturally
- SEO Description: max 160 characters, compelling and action-oriented
- Include 3-5 relevant keywords

Respond ONLY with this JSON format:
{
  "seoTitle": "Your SEO title here",
  "seoDescription": "Your meta description here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`

      const result = await this.generateContent(config, prompt, 'PRODUCT_SEO' as GeminiTaskType, 'PRODUCT_MANAGEMENT' as GeminiUsageContext, {
        systemInstruction,
        customGenerationConfig: { temperature: 0.7 },
      })

      const parsed = JSON.parse(result.text)

      return {
        success: true,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        keywords: parsed.keywords || [],
        metadata: {
          model: result.metadata.model,
          tokensUsed: result.metadata.tokensUsed,
          responseTime: Date.now() - startTime,
          cached: result.metadata.cached,
        },
      }
    } catch (error: unknown) {
      const err = error as Error
      console.error('Product SEO generation error:', err)
      return {
        success: false,
        error: err.message || 'Failed to generate product SEO',
      }
    }
  }

  /**
   * Generate SEO for a category
   */
  async generateCategorySEO(config: GeminiConfig, request: CategorySEORequest): Promise<CategorySEOResult> {
    try {
      const language = LANGUAGE_NAMES[request.targetLanguage || 'en'] || 'English'

      const systemInstruction = `You are an SEO expert specializing in e-commerce category pages.
Create SEO content that helps category pages rank well and guide users.
Always respond with valid JSON only.`

      const prompt = `Generate SEO title and description for this product category:

Category: ${request.categoryName}
${request.categoryDescription ? `Description: ${request.categoryDescription}` : ''}
${request.productCount ? `Number of Products: ${request.productCount}` : ''}
${request.topProducts?.length ? `Featured Products: ${request.topProducts.join(', ')}` : ''}

Requirements:
- Write in ${language}
- SEO Title: max 60 characters, category-focused
- SEO Description: max 160 characters, highlight category value
- Include 3-5 category-relevant keywords

Respond ONLY with this JSON format:
{
  "seoTitle": "Your category SEO title",
  "seoDescription": "Your category meta description",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`

      const result = await this.generateContent(config, prompt, 'CATEGORY_SEO' as GeminiTaskType, 'CONTENT_CREATION' as GeminiUsageContext, {
        systemInstruction,
      })

      const parsed = JSON.parse(result.text)

      return {
        success: true,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        keywords: parsed.keywords || [],
      }
    } catch (error: unknown) {
      const err = error as Error
      return {
        success: false,
        error: err.message || 'Failed to generate category SEO',
      }
    }
  }

  /**
   * Batch generate SEO for multiple products
   */
  async generateBatchProductSEO(config: GeminiConfig, request: BatchSEORequest): Promise<BatchSEOResult> {
    const results: ProductSEOResult[] = []
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < request.items.length; i++) {
      const result = await this.generateProductSEO(config, request.items[i])
      results.push(result)

      if (result.success) {
        successCount++
      } else {
        failureCount++
      }

      // Add delay between requests to avoid rate limiting
      if (i < request.items.length - 1 && request.delayBetweenMs) {
        await new Promise((resolve) => setTimeout(resolve, request.delayBetweenMs))
      }
    }

    return {
      success: failureCount === 0,
      results,
      successCount,
      failureCount,
    }
  }

  /**
   * Generate enhanced product description
   */
  async generateProductDescription(
    config: GeminiConfig,
    productName: string,
    features: string[],
    benefits: string[],
    targetLanguage: string = 'en'
  ): Promise<string> {
    const language = LANGUAGE_NAMES[targetLanguage] || 'English'

    const systemInstruction = `You are a professional e-commerce copywriter.
Write compelling product descriptions that convert browsers into buyers.
Focus on benefits and create emotional connection with the reader.`

    const prompt = `Write a compelling product description for:

Product: ${productName}
Features: ${features.join(', ')}
Benefits: ${benefits.join(', ')}

Requirements:
- Write in ${language}
- 150-250 words
- Highlight key benefits
- Include call-to-action
- Use sensory language where appropriate`

    const result = await this.generateContent(config, prompt, 'PRODUCT_DESCRIPTION' as GeminiTaskType, 'PRODUCT_MANAGEMENT' as GeminiUsageContext, {
      systemInstruction,
    })

    return result.text
  }

  /**
   * Test the Gemini connection
   */
  async testConnection(config: GeminiConfig): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now()

    try {
      await this.generateContent(
        config,
        'Say "Connection successful" in exactly those words.',
        'CONTENT_GENERATION' as GeminiTaskType,
        'DASHBOARD' as GeminiUsageContext,
        { useCache: false }
      )

      return {
        success: true,
        responseTime: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const err = error as Error
      return {
        success: false,
        error: err.message,
        responseTime: Date.now() - startTime,
      }
    }
  }

  private cleanExpiredCache(): void {
    const now = new Date()
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key)
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

// Export singleton instance
export const geminiService = GeminiService.getInstance()
