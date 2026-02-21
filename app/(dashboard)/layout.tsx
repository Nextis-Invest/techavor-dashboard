import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SiteHeader } from "@/components/dashboard/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth/session"
import { DashboardProviders } from "./providers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Require authentication for dashboard
  if (!user) {
    redirect("/login?callbackUrl=/")
  }

  // Require admin role
  if (user.role !== "ADMIN") {
    redirect("/login?error=Unauthorized")
  }

  return (
    <DashboardProviders>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <DashboardSidebar
          variant="inset"
          user={{
            name: user.name || "Admin",
            email: user.email || "",
            avatar: user.image || undefined,
            role: user.role,
          }}
        />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProviders>
  )
}
