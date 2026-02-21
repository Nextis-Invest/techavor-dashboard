import { auth } from "@/lib/auth/config"
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const session = await auth()
  return session?.user
})

export const getSession = cache(async () => {
  return await auth()
})

export const requireAuth = cache(async () => {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  return session.user
})

export const requireAdmin = cache(async () => {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required")
  }

  return session.user
})
