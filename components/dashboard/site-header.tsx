"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const PAGE_TITLES: Record<string, string> = {
  "/": "Tableau de Bord",
  "/products": "Produits",
  "/products/categories": "Categories",
  "/products/stock": "Stock",
  "/orders": "Commandes",
  "/customers": "Clients",
  "/coupons": "Coupons",
  "/settings": "Parametres",
}

import { Search, Bell, Settings, User } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()

  const getPageTitle = () => {
    if (PAGE_TITLES[pathname]) {
      return PAGE_TITLES[pathname]
    }

    if (pathname.startsWith("/products/") && pathname !== "/products") {
      if (pathname.includes("/new")) return "Nouveau Produit"
      return "Details Produit"
    }
    if (pathname.startsWith("/orders/") && pathname !== "/orders") {
      return "Details Commande"
    }
    if (pathname.startsWith("/customers/") && pathname !== "/customers") {
      return "Details Client"
    }

    return "Dashboard"
  }

  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 glass-nav sticky top-0 z-50 px-4">
      <div className="flex w-full items-center gap-4">
        <div className="flex items-center gap-2 pr-4 lg:border-r border-border/50">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-sm font-semibold whitespace-nowrap hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>

        {/* Global Search - Matching Reference Image */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-muted/30 border border-border/50 rounded-xl py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-muted/50 focus:ring-1 focus:ring-primary/20 focus:border-border transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-70 hover:opacity-100">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-70 hover:opacity-100">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="h-4 w-[1px] bg-border/50 mx-1 secret md:block hidden" />
          <Button variant="ghost" className="h-9 gap-2 rounded-xl pl-1 pr-3 hover:bg-muted/50">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-semibold hidden lg:block">Admin Demo</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
