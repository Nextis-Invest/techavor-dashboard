"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { useStoreSettings } from "../../providers"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  productName: string
  variantName: string | null
  sku: string | null
  product: {
    id: string
    name: string
    sku: string
    images: Array<{ url: string }>
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  paymentMethod: string
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  total: number
  shippingName: string | null
  shippingAddress: string | null
  shippingCity: string | null
  shippingPhone: string | null
  shippingEmail: string | null
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  } | null
  items: OrderItem[]
  coupon: {
    code: string
    discountType: string
    discountValue: number
  } | null
}

const ORDER_STATUSES = [
  { value: "PENDING", label: "En attente" },
  { value: "PROCESSING", label: "En cours" },
  { value: "SHIPPED", label: "Expedie" },
  { value: "DELIVERED", label: "Livre" },
  { value: "COMPLETED", label: "Complete" },
  { value: "CANCELLED", label: "Annule" },
]

const PAYMENT_STATUSES = [
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Paye" },
  { value: "FAILED", label: "Echoue" },
  { value: "REFUNDED", label: "Rembourse" },
]

const FULFILLMENT_STATUSES = [
  { value: "UNFULFILLED", label: "Non traite" },
  { value: "PARTIALLY_FULFILLED", label: "Partiellement traite" },
  { value: "FULFILLED", label: "Traite" },
  { value: "SHIPPED", label: "Expedie" },
  { value: "DELIVERED", label: "Livre" },
]

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const { currency } = useStoreSettings()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    status: "",
    paymentStatus: "",
    fulfillmentStatus: "",
    trackingNumber: "",
    notes: "",
  })

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Commande non trouvee")
      }

      setOrder(data.order)
      setFormData({
        status: data.order.status,
        paymentStatus: data.order.paymentStatus,
        fulfillmentStatus: data.order.fulfillmentStatus,
        trackingNumber: data.order.trackingNumber || "",
        notes: data.order.notes || "",
      })
    } catch (error: any) {
      toast.error(error.message)
      router.push("/orders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      setOrder(data.order)
      toast.success("Commande mise a jour avec succes")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Voulez-vous vraiment annuler cette commande ?")) return

    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success("Commande annulee avec succes")
      router.push("/orders")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono">
              #{order.orderNumber}
            </h2>
            <p className="text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {["PENDING", "PROCESSING"].includes(order.status) && (
            <Button variant="destructive" onClick={handleCancel}>
              Annuler la commande
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    {item.product.images[0] ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      {item.variantName && (
                        <div className="text-sm text-muted-foreground">
                          {item.variantName}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground font-mono">
                        {item.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(item.price, currency)} x {item.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.total, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatCurrency(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{formatCurrency(order.shippingCost, currency)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA</span>
                    <span>{formatCurrency(order.taxAmount, currency)}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Remise
                      {order.coupon && (
                        <Badge variant="outline" className="ml-2">
                          {order.coupon.code}
                        </Badge>
                      )}
                    </span>
                    <span>-{formatCurrency(order.discountAmount, currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.user?.name || order.shippingName || "Anonyme"}</span>
                </div>
                {(order.user?.email || order.shippingEmail) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.user?.email || order.shippingEmail}</span>
                  </div>
                )}
                {(order.user?.phone || order.shippingPhone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.user?.phone || order.shippingPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.shippingName && (
                  <div>{order.shippingName}</div>
                )}
                {order.shippingAddress && (
                  <div className="text-muted-foreground">{order.shippingAddress}</div>
                )}
                {order.shippingCity && (
                  <div className="text-muted-foreground">{order.shippingCity}</div>
                )}
                {order.shippingPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statut de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Paiement</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Traitement</Label>
                <Select
                  value={formData.fulfillmentStatus}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, fulfillmentStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FULFILLMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Expedition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Numero de suivi</Label>
                <Input
                  id="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, trackingNumber: e.target.value }))
                  }
                  placeholder="Ex: MA123456789"
                />
              </div>

              {order.shippedAt && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Expedie le:</span>{" "}
                  {formatDateTime(order.shippedAt)}
                </div>
              )}
              {order.deliveredAt && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Livre le:</span>{" "}
                  {formatDateTime(order.deliveredAt)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Notes internes sur la commande</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ajouter des notes..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <div className="font-medium">Commande creee</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                </div>
                {order.paidAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <div className="font-medium">Paiement recu</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(order.paidAt)}
                      </div>
                    </div>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="font-medium">Expedie</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(order.shippedAt)}
                      </div>
                    </div>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div>
                      <div className="font-medium">Livre</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(order.deliveredAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
