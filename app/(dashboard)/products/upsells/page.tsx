"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Pencil, Trash2, ArrowRight, TrendingUp, Package, Boxes } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface BundleItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    sku: string
    price: number
  }
}

interface Bundle {
  id: string
  productId: string
  savingsAmount: number | null
  savingsPercent: number | null
  items: BundleItem[]
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  images: { url: string }[]
  bundle: Bundle | null
}

interface Upsell {
  id: string
  fromProductId: string
  toProductId: string
  type: "UPSELL" | "CROSS_SELL" | "FREQUENTLY_BOUGHT" | "RECOMMENDED"
  discount: number | null
  message: string | null
  isActive: boolean
  position: number
  fromProduct: Product
  toProduct: Product
}

export default function UpsellsPage() {
  const [upsells, setUpsells] = useState<Upsell[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUpsell, setEditingUpsell] = useState<Upsell | null>(null)
  const [formData, setFormData] = useState({
    fromProductId: "",
    toProductId: "",
    type: "UPSELL" as Upsell["type"],
    discount: "",
    message: "",
    isActive: true,
  })

  // Separate standalone products from bundles
  const standaloneProducts = useMemo(
    () => products.filter((p) => !p.bundle),
    [products]
  )

  const bundleProducts = useMemo(
    () => products.filter((p) => p.bundle),
    [products]
  )

  // Find bundles that contain the selected base product
  const suggestedBundles = useMemo(() => {
    if (!formData.fromProductId) return bundleProducts

    return bundleProducts.filter((bundle) =>
      bundle.bundle?.items.some((item) => item.product.id === formData.fromProductId)
    )
  }, [formData.fromProductId, bundleProducts])

  useEffect(() => {
    fetchUpsells()
    fetchProducts()
  }, [])

  const fetchUpsells = async () => {
    try {
      const res = await fetch("/api/products/upsells")
      const data = await res.json()
      setUpsells(data.upsells || [])
    } catch (error) {
      toast.error("Erreur lors du chargement des upsells")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=200&status=ACTIVE")
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      toast.error("Erreur lors du chargement des produits")
    }
  }

  const openCreateDialog = () => {
    setEditingUpsell(null)
    setFormData({
      fromProductId: "",
      toProductId: "",
      type: "UPSELL",
      discount: "",
      message: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (upsell: Upsell) => {
    setEditingUpsell(upsell)
    setFormData({
      fromProductId: upsell.fromProductId,
      toProductId: upsell.toProductId,
      type: upsell.type,
      discount: upsell.discount?.toString() || "",
      message: upsell.message || "",
      isActive: upsell.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      discount: formData.discount ? parseFloat(formData.discount) : null,
      message: formData.message || null,
    }

    try {
      const res = await fetch(
        editingUpsell
          ? `/api/products/upsells/${editingUpsell.id}`
          : "/api/products/upsells",
        {
          method: editingUpsell ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success(
        editingUpsell
          ? "Upsell modifie avec succes"
          : "Upsell cree avec succes"
      )
      setIsDialogOpen(false)
      fetchUpsells()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (upsell: Upsell) => {
    if (!confirm(`Supprimer cette relation upsell ?`)) return

    try {
      const res = await fetch(`/api/products/upsells/${upsell.id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success("Upsell supprime avec succes")
      fetchUpsells()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleToggleActive = async (upsell: Upsell) => {
    try {
      const res = await fetch(`/api/products/upsells/${upsell.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !upsell.isActive }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success(
        upsell.isActive ? "Upsell desactive" : "Upsell active"
      )
      fetchUpsells()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const calculatePriceDifference = (fromPrice: number, toPrice: number) => {
    const diff = toPrice - fromPrice
    if (diff > 0) return `+${formatPrice(diff)}`
    if (diff < 0) return formatPrice(diff)
    return "0 EUR"
  }

  const isBundle = (product: Product) => !!product.bundle

  const getBundleContents = (product: Product) => {
    if (!product.bundle) return null
    return product.bundle.items.map((item) => item.product.name).join(" + ")
  }

  if (isLoading) {
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
          <h2 className="text-2xl font-bold tracking-tight">Upsells (Produit → Bundle)</h2>
          <p className="text-muted-foreground">
            Configurez les upgrades de produits vers des bundles
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Upsell
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Package className="h-4 w-4" />
            Produits standalone
          </div>
          <p className="text-2xl font-bold mt-1">{standaloneProducts.length}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Boxes className="h-4 w-4" />
            Bundles
          </div>
          <p className="text-2xl font-bold mt-1">{bundleProducts.length}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            Upsells actifs
          </div>
          <p className="text-2xl font-bold mt-1">{upsells.filter((u) => u.isActive).length}</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit de base</TableHead>
              <TableHead></TableHead>
              <TableHead>Bundle cible</TableHead>
              <TableHead>Contenu du bundle</TableHead>
              <TableHead>Difference</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upsells.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    Aucun upsell configure pour le moment
                  </p>
                  <Button variant="link" onClick={openCreateDialog} className="mt-2">
                    Creer votre premier upsell
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              upsells.map((upsell) => (
                <TableRow key={upsell.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {upsell.fromProduct.images[0] && (
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                          <Image
                            src={upsell.fromProduct.images[0].url}
                            alt={upsell.fromProduct.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{upsell.fromProduct.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(upsell.fromProduct.price)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {upsell.toProduct.images[0] && (
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                          <Image
                            src={upsell.toProduct.images[0].url}
                            alt={upsell.toProduct.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{upsell.toProduct.name}</p>
                          {isBundle(upsell.toProduct) && (
                            <Badge variant="secondary" className="text-[10px]">
                              <Boxes className="h-3 w-3 mr-1" />
                              Bundle
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(upsell.toProduct.price)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {getBundleContents(upsell.toProduct) || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className={
                      upsell.toProduct.price > upsell.fromProduct.price
                        ? "text-green-600 font-medium"
                        : upsell.toProduct.price < upsell.fromProduct.price
                        ? "text-red-600 font-medium"
                        : "text-muted-foreground"
                    }>
                      {calculatePriceDifference(
                        upsell.fromProduct.price,
                        upsell.toProduct.price
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={upsell.isActive}
                      onCheckedChange={() => handleToggleActive(upsell)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(upsell)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(upsell)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUpsell ? "Modifier l'upsell" : "Nouvel upsell"}
            </DialogTitle>
            <DialogDescription>
              Configurez un upgrade de produit vers un bundle
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fromProductId">Produit de base *</Label>
              <Select
                value={formData.fromProductId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, fromProductId: value, toProductId: "" }))
                }
                disabled={!!editingUpsell}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un produit" />
                </SelectTrigger>
                <SelectContent>
                  {standaloneProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {product.name} - {formatPrice(product.price)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le produit que le client a dans son panier (produit standalone)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toProductId">
                Bundle cible *
                {formData.fromProductId && suggestedBundles.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {suggestedBundles.length} bundle(s) suggere(s)
                  </Badge>
                )}
              </Label>
              <Select
                value={formData.toProductId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, toProductId: value }))
                }
                disabled={!!editingUpsell}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un bundle" />
                </SelectTrigger>
                <SelectContent>
                  {formData.fromProductId && suggestedBundles.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Bundles contenant ce produit
                      </div>
                      {suggestedBundles.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Boxes className="h-4 w-4 text-primary" />
                              {product.name} - {formatPrice(product.price)}
                            </div>
                            <span className="text-[10px] text-muted-foreground ml-6">
                              {getBundleContents(product)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {bundleProducts.filter((p) => !suggestedBundles.includes(p)).length > 0 && (
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                          Autres bundles
                        </div>
                      )}
                    </>
                  )}
                  {bundleProducts
                    .filter((p) => !suggestedBundles.includes(p))
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                            {product.name} - {formatPrice(product.price)}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-6">
                            {getBundleContents(product)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Le bundle a proposer en upgrade (remplace le produit de base)
              </p>
            </div>

            {formData.fromProductId && formData.toProductId && (
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difference de prix:</span>
                  <span className="font-bold text-green-600">
                    {calculatePriceDifference(
                      products.find((p) => p.id === formData.fromProductId)?.price || 0,
                      products.find((p) => p.id === formData.toProductId)?.price || 0
                    )}
                  </span>
                </div>
                {(() => {
                  const toProduct = products.find((p) => p.id === formData.toProductId)
                  if (toProduct?.bundle) {
                    return (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Contenu:</span> {getBundleContents(toProduct)}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Remise supplementaire (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, discount: e.target.value }))
                  }
                  placeholder="Ex: 10"
                />
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">Actif</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message personnalise</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Ex: Passez a la version complete et economisez 20%"
                rows={2}
              />
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
                {editingUpsell ? "Enregistrer" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
