"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Cloud,
} from "lucide-react"
import { cn, formatCurrency, formatDateTime } from "@/lib/utils"
import { useStoreSettings } from "./providers"

interface DashboardStats {
  orders: {
    total: number
    pending: number
    today: number
    month: number
    change: number
  }
  revenue: {
    total: number
    month: number
    change: number
  }
  customers: {
    total: number
    newThisMonth: number
  }
  products: {
    total: number
    active: number
    lowStock: number
  }
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  total: number
  status: string
  itemCount: number
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  SHIPPED: "Expedie",
  DELIVERED: "Livre",
  COMPLETED: "Complete",
  CANCELLED: "Annule",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { currency } = useStoreSettings()

  useEffect(() => {
    fetchStats()
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats")
      const data = await res.json()

      if (res.ok) {
        setStats(data.stats)
        setRecentOrders(data.recentOrders || [])
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section inspired by Target Image */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight">Fresh start, Admin</h2>
          <p className="text-muted-foreground text-lg">
            Ready to make today productive! 🚀
          </p>
        </div>
        <div className="flex items-center gap-6 bg-card/40 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
          <div className="text-right lg:border-r lg:pr-6 border-border/50">
            <div className="text-2xl font-bold font-mono">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Cloud className="h-5 w-5 text-primary opacity-80" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold">17°C</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Nuageux</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-glow stats-highlight border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Revenus du Mois
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatCurrency(stats?.revenue.month || 0, currency)}
            </div>
            <div className="flex items-center text-xs mt-2">
              {stats?.revenue.change !== undefined && stats.revenue.change !== 0 && (
                <span
                  className={cn(
                    "flex items-center font-bold mr-2",
                    stats.revenue.change > 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {stats.revenue.change > 0 ? "+" : ""}
                  {stats.revenue.change}%
                </span>
              )}
              <span className="text-muted-foreground font-medium">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow stats-highlight border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Commandes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats?.orders.month || 0}</div>
            <div className="flex items-center gap-2 text-xs mt-2">
              {stats?.orders.pending ? (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-bold uppercase tracking-tighter">
                  {stats.orders.pending} en attente
                </Badge>
              ) : null}
              <span className="text-muted-foreground font-medium">ce mois-ci</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow stats-highlight border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Produits</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Package className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats?.products.active || 0}</div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <span className="text-muted-foreground font-medium">
                sur {stats?.products.total || 0} actifs
              </span>
              {stats?.products.lowStock ? (
                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-bold uppercase tracking-tighter">
                  {stats.products.lowStock} stock bas
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow stats-highlight border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clients</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Users className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats?.customers.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              <span className="text-emerald-500 font-bold">+{stats?.customers.newThisMonth || 0}</span> nouveaux ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune commande pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium font-mono hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {order.customer} &bull; {order.itemCount} article(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(order.total, currency)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertes</CardTitle>
            {stats?.products.lowStock ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products/stock">
                  Gerer le stock
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {!stats?.products.lowStock && !stats?.orders.pending ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune alerte pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {stats?.orders.pending ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <ShoppingCart className="h-5 w-5 opacity-70" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        Commandes en attente
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.orders.pending} commande(s) a traiter
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/orders?status=PENDING">Voir</Link>
                    </Button>
                  </div>
                ) : null}

                {stats?.products.lowStock ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <AlertTriangle className="h-5 w-5 opacity-70" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Stock bas</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.products.lowStock} produit(s) en stock bas
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/products/stock?lowStock=true">
                        Voir
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
