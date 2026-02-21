"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { useStoreSettings } from "../providers"

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  total: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  } | null
  shippingName: string | null
  shippingPhone: string | null
  shippingCity: string | null
  _count: {
    items: number
  }
}

const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "En attente", variant: "secondary" },
  PROCESSING: { label: "En cours", variant: "default" },
  SHIPPED: { label: "Expedie", variant: "default" },
  DELIVERED: { label: "Livre", variant: "default" },
  COMPLETED: { label: "Complete", variant: "default" },
  CANCELLED: { label: "Annule", variant: "destructive" },
  REFUNDED: { label: "Rembourse", variant: "outline" },
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-muted text-foreground" },
  PAID: { label: "Paye", color: "bg-foreground text-background" },
  FAILED: { label: "Echoue", color: "bg-destructive text-destructive-foreground" },
  REFUNDED: { label: "Rembourse", color: "bg-muted text-muted-foreground" },
}

const FULFILLMENT_STATUS: Record<string, { label: string; color: string }> = {
  UNFULFILLED: { label: "Non traite", color: "bg-muted text-muted-foreground" },
  PARTIALLY_FULFILLED: { label: "Partiel", color: "bg-muted text-foreground" },
  FULFILLED: { label: "Traite", color: "bg-foreground text-background" },
  SHIPPED: { label: "Expedie", color: "bg-foreground/80 text-background" },
  DELIVERED: { label: "Livre", color: "bg-foreground text-background" },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all")
  const { currency } = useStoreSettings()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchOrders()
  }, [pagination.page, search, statusFilter, paymentFilter, fulfillmentFilter])

  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.set("search", search)
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
      if (paymentFilter && paymentFilter !== "all") params.set("paymentStatus", paymentFilter)
      if (fulfillmentFilter && fulfillmentFilter !== "all") params.set("fulfillmentStatus", fulfillmentFilter)

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      setOrders(data.orders || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      toast.error("Erreur lors du chargement des commandes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchOrders()
  }

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commandes</h2>
          <p className="text-muted-foreground">
            Gerez les commandes de votre boutique
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numero, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </form>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(ORDER_STATUS).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous paiements</SelectItem>
            {Object.entries(PAYMENT_STATUS).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Traitement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous traitements</SelectItem>
            {Object.entries(FULFILLMENT_STATUS).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Traitement</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucune commande trouvee
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const statusConfig = ORDER_STATUS[order.status] || { label: order.status, variant: "secondary" as const }
                const paymentConfig = PAYMENT_STATUS[order.paymentStatus] || { label: order.paymentStatus, color: "bg-gray-100" }
                const fulfillmentConfig = FULFILLMENT_STATUS[order.fulfillmentStatus] || { label: order.fulfillmentStatus, color: "bg-gray-100" }

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium font-mono">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order._count.items} article(s)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.user?.name || order.shippingName || "Anonyme"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.shippingPhone || order.user?.phone || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={paymentConfig.color}>
                        {paymentConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={fulfillmentConfig.color}>
                        {fulfillmentConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total, currency)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} commandes)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Precedent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
