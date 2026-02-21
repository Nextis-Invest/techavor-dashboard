"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  LogOut,
  ChevronRight,
  FolderTree,
  Boxes,
  User,
  FolderOpen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Logo } from "@/components/logo"
import { UnreadBadge } from "@/components/messaging/UnreadBadge"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  items?: SubNavItem[]
}

interface SubNavItem {
  title: string
  url: string
}

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

const navigationItems: NavItem[] = [
  {
    title: "Tableau de Bord",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Produits",
    url: "/products",
    icon: Package,
    items: [
      { title: "Tous les Produits", url: "/products" },
      { title: "Categories", url: "/products/categories" },
      { title: "Upsells", url: "/products/upsells" },
      { title: "Stock", url: "/products/stock" },
    ],
  },
  {
    title: "Commandes",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Clients",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Coupons",
    url: "/coupons",
    icon: Tag,
  },
  {
    title: "Projets",
    url: "/intakes",
    icon: FolderOpen,
  },
]

const settingsItems: NavItem[] = [
  {
    title: "Parametres",
    url: "/settings",
    icon: Settings,
  },
]

export function DashboardSidebar({ user, ...props }: DashboardSidebarProps) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/"
    return pathname.startsWith(url)
  }

  const hasActiveSubItem = (items?: SubNavItem[]) => {
    if (!items) return false
    return items.some((item) => pathname === item.url || pathname.startsWith(item.url + "/"))
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="flex items-center gap-3">
                <Logo size="sm" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-widest uppercase font-bold text-muted-foreground/50 px-4 mb-2">Main</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.url)
              const hasSubActive = hasActiveSubItem(item.items)

              if (item.items) {
                return (
                  <Collapsible
                    key={item.title}
                    defaultOpen={active || hasSubActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={active || hasSubActive}
                        >
                          <Icon className="size-4 opacity-70" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                    <Link href={item.url}>
                      <Icon className="size-4 opacity-70" />
                      <span>{item.title}</span>
                      {item.url === "/intakes" && <UnreadBadge />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-widest uppercase font-bold text-muted-foreground/50 px-4 mb-2 mt-4">Admin & Settings</SidebarGroupLabel>
          <SidebarMenu>
            {settingsItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.url)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={active}>
                    <Link href={item.url}>
                      <Icon className="size-4 opacity-70" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg">
                <Link href="/settings">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="size-4" />
                  <span>Deconnexion</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/login">
                  <User className="size-4" />
                  <span>Connexion</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
