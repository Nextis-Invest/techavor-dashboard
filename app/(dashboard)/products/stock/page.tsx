"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Search, Package, AlertTriangle, Plus, Minus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface InventoryItem {
  id: string
  quantity: number
  reservedQuantity: number
  lowStockThreshold: number
  product: {
    id: string
    name: string
    sku: string
    price: number
    status: string
    images: Array<{ url: string }>
  }
  variant: {
    id: string
    sku: string
    name: string
  } | null
  warehouse: {
    id: string
    name: string
    code: string
  }
}

const MOVEMENT_TYPES = [
  { value: "IN", label: "Entree", icon: Plus, color: "text-green-600" },
  { value: "OUT", label: "Sortie", icon: Minus, color: "text-red-600" },
  { value: "ADJUSTMENT", label: "Ajustement", icon: RefreshCw, color: "text-blue-600" },
  { value: "RETURN", label: "Retour", icon: RefreshCw, color: "text-orange-600" },
  { value: "DAMAGE", label: "Dommage", icon: Minus, color: "text-red-600" },
  { value: "LOSS", label: "Perte", icon: Minus, color: "text-red-600" },
]

export default function StockPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Adjustment dialog state
  const [adjustmentDialog, setAdjustmentDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentData, setAdjustmentData] = useState({
    type: "IN",
    quantity: "",
    reason: "",
  })
  const [isAdjusting, setIsAdjusting] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [pagination.page, search, lowStockOnly])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) params.set("search", search)
      if (lowStockOnly) params.set("lowStock", "true")

      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()

      setInventory(data.inventory || [])
      setLowStockCount(data.lowStockCount || 0)
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      toast.error("Erreur lors du chargement du stock")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchInventory()
  }

  const openAdjustmentDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustmentData({ type: "IN", quantity: "", reason: "" })
    setAdjustmentDialog(true)
  }

  const handleAdjustment = async () => {
    if (!selectedItem || !adjustmentData.quantity) return

    setIsAdjusting(true)
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedItem.product.id,
          variantId: selectedItem.variant?.id || null,
          warehouseId: selectedItem.warehouse.id,
          type: adjustmentData.type,
          quantity: parseInt(adjustmentData.quantity),
          reason: adjustmentData.reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success("Stock mis a jour avec succes")
      setAdjustmentDialog(false)
      fetchInventory()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsAdjusting(false)
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const available = item.quantity - item.reservedQuantity
    if (available <= 0) {
      return { label: "Rupture", variant: "destructive" as const }
    }
    if (item.quantity <= item.lowStockThreshold) {
      return { label: "Stock bas", variant: "secondary" as const }
    }
    return { label: "En stock", variant: "default" as const }
  }

  if (isLoading && inventory.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight">Gestion du Stock</h2>
          <p className="text-muted-foreground">
            Suivez et ajustez les niveaux de stock
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/products/stock/movements">
            Historique des mouvements
          </Link>
        </Button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="text-sm">
            <strong>{lowStockCount}</strong> produit(s) en stock bas
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            {lowStockOnly ? "Voir tout" : "Voir uniquement"}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, SKU..."
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
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Entrepot</TableHead>
              <TableHead className="text-right">Quantite</TableHead>
              <TableHead className="text-right">Reserve</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun stock enregistre
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              inventory.map((item) => {
                const status = getStockStatus(item)
                const available = item.quantity - item.reservedQuantity

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.product.images[0] ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        {item.variant && (
                          <div className="text-sm text-muted-foreground">
                            {item.variant.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.variant?.sku || item.product.sku}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.warehouse.name}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.reservedQuantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {available}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAdjustmentDialog(item)}
                      >
                        Ajuster
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
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} articles)
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

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
            <DialogDescription>
              {selectedItem?.product.name}
              {selectedItem?.variant && ` - ${selectedItem.variant.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Stock actuel</p>
                <p className="text-2xl font-bold">{selectedItem?.quantity}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <Select
                value={adjustmentData.type}
                onValueChange={(value) =>
                  setAdjustmentData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                {adjustmentData.type === "ADJUSTMENT"
                  ? "Nouveau stock"
                  : "Quantite"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={adjustmentData.quantity}
                onChange={(e) =>
                  setAdjustmentData((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                placeholder={
                  adjustmentData.type === "ADJUSTMENT"
                    ? "Nouveau niveau de stock"
                    : "Quantite a ajouter/retirer"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Input
                id="reason"
                value={adjustmentData.reason}
                onChange={(e) =>
                  setAdjustmentData((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Ex: Inventaire, reception commande..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustmentDialog(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleAdjustment} disabled={isAdjusting}>
              {isAdjusting ? "Mise a jour..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
