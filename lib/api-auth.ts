import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./prisma"
import crypto from "crypto"

export type ApiPermission = "read" | "write" | "checkout" | "webhooks" | "admin"

interface ApiKeyValidation {
  isValid: boolean
  apiKey?: {
    id: string
    name: string
    permissions: string[]
  }
  error?: string
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

/**
 * Generate a new API key
 * Returns both the raw key (to show to user once) and the hash (to store)
 */
export function generateApiKey(): { rawKey: string; hashedKey: string; prefix: string } {
  const rawKey = `nxts_${crypto.randomBytes(32).toString("hex")}`
  const hashedKey = hashApiKey(rawKey)
  const prefix = rawKey.substring(0, 12)
  return { rawKey, hashedKey, prefix }
}

/**
 * Validate an API key from request headers
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyValidation> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader) {
    return { isValid: false, error: "Missing Authorization header" }
  }

  const [scheme, token] = authHeader.split(" ")

  if (scheme !== "Bearer" || !token) {
    return { isValid: false, error: "Invalid Authorization format. Use: Bearer <api_key>" }
  }

  const hashedKey = hashApiKey(token)

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      select: {
        id: true,
        name: true,
        permissions: true,
        isActive: true,
        expiresAt: true,
      },
    })

    if (!apiKey) {
      return { isValid: false, error: "Invalid API key" }
    }

    if (!apiKey.isActive) {
      return { isValid: false, error: "API key is deactivated" }
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { isValid: false, error: "API key has expired" }
    }

    // Update last used timestamp (fire and forget)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    return {
      isValid: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        permissions: apiKey.permissions,
      },
    }
  } catch (error) {
    console.error("API key validation error:", error)
    return { isValid: false, error: "Internal error validating API key" }
  }
}

/**
 * Check if an API key has a specific permission
 */
export function hasPermission(permissions: string[], required: ApiPermission): boolean {
  return permissions.includes(required) || permissions.includes("admin")
}

/**
 * Middleware wrapper for API routes that require authentication
 */
export function withApiAuth(
  handler: (request: NextRequest, apiKey: ApiKeyValidation["apiKey"]) => Promise<NextResponse>,
  requiredPermission?: ApiPermission
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const validation = await validateApiKey(request)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      )
    }

    if (requiredPermission && !hasPermission(validation.apiKey!.permissions, requiredPermission)) {
      return NextResponse.json(
        { error: `Missing required permission: ${requiredPermission}` },
        { status: 403 }
      )
    }

    return handler(request, validation.apiKey!)
  }
}

/**
 * CORS headers for external API access
 */
export function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}
