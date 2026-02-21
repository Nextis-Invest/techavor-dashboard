import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateApiKey } from "@/lib/api-auth"

export async function GET() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(apiKeys)
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const { rawKey, hashedKey, prefix } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        name: body.name,
        key: hashedKey,
        keyPrefix: prefix,
        permissions: body.permissions || ["read"],
        isActive: true,
      },
    })

    // Return the raw key only once - it won't be retrievable later
    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      rawKey: rawKey,
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions,
    })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    )
  }
}
