/**
 * Config Transformer
 * Transforms Prisma gemini_configs (snake_case) to GeminiConfig interface (camelCase)
 */

import type { GeminiConfig, GeminiTaskType, GeminiUsageContext } from '../types'

// Type for Prisma gemini_configs table (snake_case)
export interface PrismaGeminiConfig {
  id: string
  name: string
  description: string | null
  api_key: string
  model: string
  temperature: number | null
  max_tokens: number | null
  top_p: number | null
  top_k: number | null
  candidate_count: number | null
  stop_sequences: string[] | null
  presence_penalty: number | null
  frequency_penalty: number | null
  seed: number | null
  response_format: string | null
  enabled_tasks: string[]
  usage_context: string
  is_active: boolean | null
  rate_limit_per_minute: number | null
  rate_limit_per_hour: number | null
  daily_quota: number | null
  safety_settings: unknown
  system_instruction: string | null
  custom_headers: unknown
  timeout_ms: number | null
  retry_attempts: number | null
  created_at: Date | null
  updated_at: Date | null
  created_by: string | null
}

/**
 * Transform Prisma gemini_configs (snake_case) to GeminiConfig interface (camelCase)
 */
export function transformGeminiConfig(dbConfig: PrismaGeminiConfig): GeminiConfig {
  return {
    id: dbConfig.id,
    name: dbConfig.name,
    description: dbConfig.description || undefined,
    apiKey: dbConfig.api_key,
    model: dbConfig.model,
    temperature: dbConfig.temperature ? Number(dbConfig.temperature) : 0.7,
    maxTokens: dbConfig.max_tokens || 2048,
    topP: dbConfig.top_p ? Number(dbConfig.top_p) : 0.9,
    topK: dbConfig.top_k || 40,
    candidateCount: dbConfig.candidate_count || 1,
    stopSequences: dbConfig.stop_sequences || undefined,
    presencePenalty: dbConfig.presence_penalty ? Number(dbConfig.presence_penalty) : 0.0,
    frequencyPenalty: dbConfig.frequency_penalty ? Number(dbConfig.frequency_penalty) : 0.0,
    seed: dbConfig.seed || undefined,
    responseFormat: dbConfig.response_format || 'text',
    enabledTasks: dbConfig.enabled_tasks as GeminiTaskType[],
    usageContext: dbConfig.usage_context as GeminiUsageContext,
    isActive: dbConfig.is_active || false,
    rateLimitPerMinute: dbConfig.rate_limit_per_minute || 60,
    rateLimitPerHour: dbConfig.rate_limit_per_hour || 1000,
    dailyQuota: dbConfig.daily_quota || 10000,
    safetySettings: (dbConfig.safety_settings as Record<string, unknown>) || {},
    systemInstruction: dbConfig.system_instruction || undefined,
    customHeaders: (dbConfig.custom_headers as Record<string, string>) || {},
    timeoutMs: dbConfig.timeout_ms || 30000,
    retryAttempts: dbConfig.retry_attempts || 3,
    createdAt: dbConfig.created_at || undefined,
    updatedAt: dbConfig.updated_at || undefined,
    createdBy: dbConfig.created_by || undefined,
  }
}

/**
 * Get active Gemini config from database and transform it
 */
export async function getActiveGeminiConfig(prisma: {
  gemini_configs: {
    findFirst: (args: { where: { is_active: boolean } }) => Promise<PrismaGeminiConfig | null>
  }
}): Promise<GeminiConfig | null> {
  const dbConfig = await prisma.gemini_configs.findFirst({
    where: { is_active: true },
  })

  if (!dbConfig) {
    return null
  }

  return transformGeminiConfig(dbConfig)
}

/**
 * Create a simple config from environment variables (for quick setup)
 */
export function createConfigFromEnv(): GeminiConfig | null {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  return {
    name: 'Environment Config',
    apiKey,
    model: process.env.GEMINI_MODEL || 'GEMINI_2_5_FLASH',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048', 10),
    topP: 0.9,
    topK: 40,
    candidateCount: 1,
    presencePenalty: 0,
    frequencyPenalty: 0,
    responseFormat: 'text',
    enabledTasks: ['PRODUCT_SEO', 'PRODUCT_DESCRIPTION', 'CATEGORY_SEO'] as GeminiTaskType[],
    usageContext: 'PRODUCT_MANAGEMENT' as GeminiUsageContext,
    isActive: true,
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    dailyQuota: 10000,
    safetySettings: {},
    customHeaders: {},
    timeoutMs: 30000,
    retryAttempts: 3,
  }
}
