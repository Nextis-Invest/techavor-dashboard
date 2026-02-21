// Gemini AI Module Types

export enum GeminiModel {
  // Auto-updating aliases (recommended)
  GEMINI_FLASH_LATEST = 'GEMINI_FLASH_LATEST',
  GEMINI_PRO_LATEST = 'GEMINI_PRO_LATEST',
  // Specific Gemini 2.5 models
  GEMINI_2_5_PRO = 'GEMINI_2_5_PRO',
  GEMINI_2_5_FLASH = 'GEMINI_2_5_FLASH',
  GEMINI_2_5_FLASH_LITE = 'GEMINI_2_5_FLASH_LITE',
  // Gemini 2.0 models
  GEMINI_2_0_FLASH = 'GEMINI_2_0_FLASH',
  GEMINI_2_0_FLASH_LITE = 'GEMINI_2_0_FLASH_LITE',
  // Legacy 1.x models
  GEMINI_1_5_FLASH = 'GEMINI_1_5_FLASH',
  GEMINI_1_5_PRO = 'GEMINI_1_5_PRO',
  GEMINI_PRO = 'GEMINI_PRO',
}

export enum GeminiTaskType {
  PRODUCT_SEO = 'PRODUCT_SEO',
  PRODUCT_DESCRIPTION = 'PRODUCT_DESCRIPTION',
  CONTENT_GENERATION = 'CONTENT_GENERATION',
  TRANSLATION = 'TRANSLATION',
  SEO_OPTIMIZATION = 'SEO_OPTIMIZATION',
  CATEGORY_SEO = 'CATEGORY_SEO',
}

export enum GeminiUsageContext {
  DASHBOARD = 'DASHBOARD',
  PRODUCT_MANAGEMENT = 'PRODUCT_MANAGEMENT',
  CONTENT_CREATION = 'CONTENT_CREATION',
  AUTOMATION = 'AUTOMATION',
}

export interface GeminiConfig {
  id?: string
  name: string
  description?: string
  apiKey: string
  model: GeminiModel | string
  temperature: number
  maxTokens: number
  topP: number
  topK: number
  candidateCount: number
  stopSequences?: string[]
  presencePenalty: number
  frequencyPenalty: number
  seed?: number
  responseFormat: string
  enabledTasks: GeminiTaskType[]
  usageContext: GeminiUsageContext
  isActive: boolean
  rateLimitPerMinute: number
  rateLimitPerHour: number
  dailyQuota: number
  safetySettings: Record<string, unknown>
  systemInstruction?: string
  customHeaders: Record<string, string>
  timeoutMs: number
  retryAttempts: number
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
}

export interface GeminiGenerationConfig {
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
  candidateCount?: number
  stopSequences?: string[]
  presencePenalty?: number
  frequencyPenalty?: number
  seed?: number
  responseFormat?: string
}

// SEO Generation Types
export interface ProductSEORequest {
  productName: string
  productDescription?: string
  category?: string
  keywords?: string[]
  targetLanguage?: 'en' | 'fr' | 'es' | 'de' | 'ar' | 'nl'
  tone?: 'professional' | 'casual' | 'luxury' | 'technical'
}

export interface ProductSEOResult {
  success: boolean
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  error?: string
  metadata?: {
    model: string
    tokensUsed: number
    responseTime: number
    cached: boolean
  }
}

export interface CategorySEORequest {
  categoryName: string
  categoryDescription?: string
  productCount?: number
  topProducts?: string[]
  targetLanguage?: 'en' | 'fr' | 'es' | 'de' | 'ar' | 'nl'
}

export interface CategorySEOResult {
  success: boolean
  seoTitle?: string
  seoDescription?: string
  keywords?: string[]
  error?: string
}

export interface BatchSEORequest {
  items: ProductSEORequest[]
  delayBetweenMs?: number
}

export interface BatchSEOResult {
  success: boolean
  results: ProductSEOResult[]
  successCount: number
  failureCount: number
}

// Error types
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'GeminiAPIError'
  }
}
