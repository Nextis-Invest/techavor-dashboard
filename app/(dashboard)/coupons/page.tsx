"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Plus, Pencil, Trash2, Ticket, Search } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useStoreSettings } from "../providers"

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  minimumPurchase: number | null
  maximumDiscount: number | null
  usageLimit: number | null
  usageLimitPerUser: number
  usedCount: number
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
  _count: {
    usages: number
  }
}

const getDiscountTypes = (currency: string) => [
  { value: "PERCENTAGE", label: "Pourcentage (%)" },
  { value: "FIXED", label: `Montant fixe (${currency})` },
  { value: "FREE_SHIPPING", label: "Livraison gratuite" },
]

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const { currency } = useStoreSettings()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minimumPurchase: "",
    maximumDiscount: "",
    usageLimit: "",
    usageLimitPerUser: "1",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchCoupons()
  }, [pagination.page, search])

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.set("search", search)

      const res = await fetch(`/api/coupons/admin?${params}`)
      const data = await res.json()

      setCoupons(data.coupons || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      toast.error("Erreur lors du chargement des coupons")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCoupons()
  }

  const openCreateDialog = () => {
    setEditingCoupon(null)
    setFormData({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minimumPurchase: "",
      maximumDiscount: "",
      usageLimit: "",
      usageLimitPerUser: "1",
      startDate: "",
      endDate: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minimumPurchase: coupon.minimumPurchase?.toString() || "",
      maximumDiscount: coupon.maximumDiscount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      usageLimitPerUser: coupon.usageLimitPerUser.toString(),
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
      isActive: coupon.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      code: formData.code,
      description: formData.description || null,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue) || 0,
      minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : null,
      maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      usageLimitPerUser: parseInt(formData.usageLimitPerUser) || 1,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      isActive: formData.isActive,
    }

    try {
      const res = await fetch(
        editingCoupon
          ? `/api/coupons/admin/${editingCoupon.id}`
          : "/api/coupons/admin",
        {
          method: editingCoupon ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success(
        editingCoupon
          ? "Coupon modifie avec succes"
          : "Coupon cree avec succes"
      )
      setIsDialogOpen(false)
      fetchCoupons()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Supprimer le coupon "${coupon.code}" ?`)) return

    try {
      const res = await fetch(`/api/coupons/admin/${coupon.id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success(data.message || "Coupon supprime avec succes")
      fetchCoupons()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return { label: "Inactif", variant: "secondary" as const }
    }

    const now = new Date()
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { label: "Programme", variant: "outline" as const }
    }
    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return { label: "Expire", variant: "destructive" as const }
    }
    if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
      return { label: "Epuise", variant: "destructive" as const }
    }

    return { label: "Actif", variant: "default" as const }
  }

  const formatDiscountValue = (coupon: Coupon) => {
    switch (coupon.discountType) {
      case "PERCENTAGE":
        return `${coupon.discountValue}%`
      case "FIXED":
        return formatCurrency(coupon.discountValue, currency)
      case "FREE_SHIPPING":
        return "Livraison gratuite"
      default:
        return coupon.discountValue
    }
  }

  if (isLoading && coupons.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground">
            Gerez vos codes promotionnels
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Coupon
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Remise</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Utilisation</TableHead>
              <TableHead>Validite</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Ticket className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun coupon trouve
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => {
                const status = getCouponStatus(coupon)

                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div>
                        <div className="font-mono font-bold">{coupon.code}</div>
                        {coupon.description && (
                          <div className="text-sm text-muted-foreground">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatDiscountValue(coupon)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {coupon.minimumPurchase && (
                        <div>Min: {formatCurrency(coupon.minimumPurchase, currency)}</div>
                      )}
                      {coupon.maximumDiscount && (
                        <div>Max: {formatCurrency(coupon.maximumDiscount, currency)}</div>
                      )}
                      {!coupon.minimumPurchase && !coupon.maximumDiscount && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>
                          {coupon._count.usages}
                          {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                        </div>
                        <div className="text-muted-foreground">
                          {coupon.usageLimitPerUser}/user
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {coupon.startDate || coupon.endDate ? (
                        <div>
                          {coupon.startDate && (
                            <div>Du: {formatDate(coupon.startDate)}</div>
                          )}
                          {coupon.endDate && (
                            <div>Au: {formatDate(coupon.endDate)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Illimite</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} coupons)
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

      {/* Coupon Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? "Modifier le coupon" : "Nouveau coupon"}
            </DialogTitle>
            <DialogDescription>
              {editingCoupon
                ? "Modifiez les informations du coupon"
                : "Creez un nouveau code promotionnel"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="PROMO20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Type de remise *</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, discountType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getDiscountTypes(currency).map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="20% de reduction sur tout le site"
              />
            </div>

            {formData.discountType !== "FREE_SHIPPING" && (
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Valeur {formData.discountType === "PERCENTAGE" ? "(%)" : `(${currency})`} *
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step={formData.discountType === "PERCENTAGE" ? "1" : "0.01"}
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, discountValue: e.target.value }))
                    }
                    required
                  />
                </div>

                {formData.discountType === "PERCENTAGE" && (
                  <div className="space-y-2">
                    <Label htmlFor="maximumDiscount">Remise max ({currency})</Label>
                    <Input
                      id="maximumDiscount"
                      type="number"
                      step="0.01"
                      value={formData.maximumDiscount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maximumDiscount: e.target.value }))
                      }
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimumPurchase">Achat minimum ({currency})</Label>
                <Input
                  id="minimumPurchase"
                  type="number"
                  step="0.01"
                  value={formData.minimumPurchase}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, minimumPurchase: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usageLimit">Limite d&apos;utilisation</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))
                  }
                  placeholder="Illimite"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de debut</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Coupon actif</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingCoupon ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
