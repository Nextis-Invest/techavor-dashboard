import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for creating/updating config
const GeminiConfigSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  apiKey: z.string().min(1, 'API key is required'),
  model: z.enum([
    'GEMINI_FLASH_LATEST',
    'GEMINI_PRO_LATEST',
    'GEMINI_2_5_PRO',
    'GEMINI_2_5_FLASH',
    'GEMINI_2_5_FLASH_LITE',
    'GEMINI_2_0_FLASH',
    'GEMINI_2_0_FLASH_LITE',
    'GEMINI_1_5_FLASH',
    'GEMINI_1_5_PRO',
    'GEMINI_PRO',
  ]).default('GEMINI_2_5_FLASH'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32000).default(2048),
  isActive: z.boolean().default(false),
})

// GET /api/gemini/config - List all configs
export async function GET() {
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

    const configs = await prisma.geminiConfig.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        model: true,
        temperature: true,
        maxTokens: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't expose API key in list
        _count: {
          select: { usageLogs: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      configs: configs.map((c) => ({
        ...c,
        temperature: c.temperature ? Number(c.temperature) : 0.7,
        usageCount: c._count.usageLogs,
      })),
    })
  } catch (error) {
    console.error('Error fetching Gemini configs:', error)
    return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 })
  }
}

// POST /api/gemini/config - Create new config
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = GeminiConfigSchema.parse(body)

    // If this config is active, deactivate all others
    if (data.isActive) {
      await prisma.geminiConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const config = await prisma.geminiConfig.create({
      data: {
        name: data.name,
        description: data.description,
        apiKey: data.apiKey,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        isActive: data.isActive,
        createdBy: user.id,
        enabledTasks: ['PRODUCT_SEO', 'PRODUCT_DESCRIPTION', 'CATEGORY_SEO'],
        usageContext: 'PRODUCT_MANAGEMENT',
      },
    })

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        name: config.name,
        model: config.model,
        isActive: config.isActive,
      },
    })
  } catch (error) {
    console.error('Error creating Gemini config:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 })
  }
}

// PUT /api/gemini/config - Update config
export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    // If making this config active, deactivate all others
    if (updateData.isActive) {
      await prisma.geminiConfig.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      })
    }

    const config = await prisma.geminiConfig.update({
      where: { id },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.apiKey && { apiKey: updateData.apiKey }),
        ...(updateData.model && { model: updateData.model }),
        ...(updateData.temperature !== undefined && { temperature: updateData.temperature }),
        ...(updateData.maxTokens !== undefined && { maxTokens: updateData.maxTokens }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        name: config.name,
        model: config.model,
        isActive: config.isActive,
      },
    })
  } catch (error) {
    console.error('Error updating Gemini config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

// DELETE /api/gemini/config - Delete config
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    await prisma.geminiConfig.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Gemini config:', error)
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 })
  }
}
