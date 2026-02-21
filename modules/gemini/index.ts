/**
 * Gemini AI Module - Public API
 *
 * Provides SEO title and description generation for products and categories
 * using Google Gemini AI.
 *
 * Usage:
 * ```typescript
 * import { geminiService, createConfigFromEnv } from '@/modules/gemini'
 *
 * const config = createConfigFromEnv()
 * if (config) {
 *   const result = await geminiService.generateProductSEO(config, {
 *     productName: 'Premium Wireless Headphones',
 *     category: 'Electronics',
 *     keywords: ['wireless', 'bluetooth', 'noise-cancelling']
 *   })
 *   console.log(result.seoTitle, result.seoDescription)
 * }
 * ```
 */

// Export types
export * from './types'

// Export service
export { GeminiService, geminiService } from './lib/gemini-service'

// Export config utilities
export {
  transformGeminiConfig,
  getActiveGeminiConfig,
  createConfigFromEnv,
  type PrismaGeminiConfig,
} from './lib/config-transformer'
