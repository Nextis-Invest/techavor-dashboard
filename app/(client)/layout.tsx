import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login?callbackUrl=/my-project")
  // Both CUSTOMER and ADMIN can access client routes
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">⚡ TECHAVOR</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
