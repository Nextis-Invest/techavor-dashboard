import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geminiService } from '@/modules/gemini'
import type { GeminiConfig } from '@/modules/gemini'

// POST /api/gemini/test - Test a Gemini configuration
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { configId, apiKey, model } = body

    let config: GeminiConfig

    if (configId) {
      // Test existing config
      const dbConfig = await prisma.geminiConfig.findUnique({
        where: { id: configId },
      })

      if (!dbConfig) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 })
      }

      config = {
        name: dbConfig.name,
        apiKey: dbConfig.apiKey,
        model: dbConfig.model,
        temperature: dbConfig.temperature ? Number(dbConfig.temperature) : 0.7,
        maxTokens: dbConfig.maxTokens || 2048,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
        responseFormat: 'text',
        enabledTasks: [],
        usageContext: 'DASHBOARD',
        isActive: true,
        rateLimitPerMinute: 60,
        rateLimitPerHour: 1000,
        dailyQuota: 10000,
        safetySettings: {},
        customHeaders: {},
        timeoutMs: 30000,
        retryAttempts: 1,
      }
    } else if (apiKey) {
      // Test new API key before saving
      config = {
        name: 'Test Config',
        apiKey,
        model: model || 'GEMINI_2_5_FLASH',
        temperature: 0.7,
        maxTokens: 256,
        topP: 0.9,
        topK: 40,
        candidateCount: 1,
        presencePenalty: 0,
        frequencyPenalty: 0,
        responseFormat: 'text',
        enabledTasks: [],
        usageContext: 'DASHBOARD',
        isActive: true,
        rateLimitPerMinute: 60,
        rateLimitPerHour: 1000,
        dailyQuota: 10000,
        safetySettings: {},
        customHeaders: {},
        timeoutMs: 15000,
        retryAttempts: 1,
      }
    } else {
      return NextResponse.json({ error: 'Either configId or apiKey is required' }, { status: 400 })
    }

    const result = await geminiService.testConnection(config)

    return NextResponse.json({
      success: result.success,
      responseTime: result.responseTime,
      error: result.error,
    })
  } catch (error) {
    console.error('Error testing Gemini connection:', error)
    const err = error as Error
    return NextResponse.json({
      success: false,
      error: err.message || 'Connection test failed',
    })
  }
}
