/**
 * API Authentication Middleware
 *
 * Provides authentication and authorization utilities for API routes.
 * Supports different access levels: public, user, affiliate, admin
 */

import { auth } from "@/lib/auth/config"
import { NextRequest, NextResponse } from "next/server"
import type { Session } from "next-auth"

export type AuthLevel = "public" | "user" | "affiliate" | "admin"

export interface AuthResult {
  authorized: boolean
  session?: Session
  response?: Response
}

/**
 * Check if a user is authorized for a given access level
 */
export async function requireAuth(
  req: NextRequest,
  level: AuthLevel = "user"
): Promise<AuthResult> {
  if (level === "public") {
    return { authorized: true }
  }

  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required. Please log in.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    }
  }

  const userRole = session.user.role

  if (level === "admin") {
    if (userRole !== "ADMIN") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: "Forbidden",
            message: "Admin access required.",
            code: "INSUFFICIENT_PERMISSIONS",
          },
          { status: 403 }
        ),
      }
    }
  }

  if (level === "affiliate") {
    if (userRole !== "AFFILIATE" && userRole !== "ADMIN") {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: "Forbidden",
            message: "Affiliate access required.",
            code: "INSUFFICIENT_PERMISSIONS",
          },
          { status: 403 }
        ),
      }
    }
  }

  return {
    authorized: true,
    session,
  }
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>,
  level: AuthLevel = "user"
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const { authorized, response, session } = await requireAuth(req, level)

    if (!authorized) {
      return response!
    }

    ;(req as any).session = session

    try {
      return await handler(req, ...args)
    } catch (error) {
      console.error("API route error:", error)

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "An unexpected error occurred.",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Utility to check if a session belongs to an admin
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMIN"
}

/**
 * Utility to check if a session belongs to an affiliate
 */
export function isAffiliate(session: Session | null): boolean {
  return session?.user?.role === "AFFILIATE" || session?.user?.role === "ADMIN"
}

/**
 * Get session or throw error
 */
export async function getSessionOrThrow(req: NextRequest): Promise<Session> {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  return session
}
