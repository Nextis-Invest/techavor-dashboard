"use client"

import { useState, useEffect } from "react"
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
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCw, History } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils"

interface StockMovement {
  id: string
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string
  inventory: {
    product: {
      id: string
      name: string
      sku: string
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
}

const MOVEMENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  IN: { label: "Entree", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: ArrowDownRight },
  OUT: { label: "Sortie", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpRight },
  ADJUSTMENT: { label: "Ajustement", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw },
  TRANSFER: { label: "Transfert", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: RefreshCw },
  RETURN: { label: "Retour", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: ArrowDownRight },
  DAMAGE: { label: "Dommage", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpRight },
  LOSS: { label: "Perte", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: ArrowUpRight },
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchMovements()
  }, [pagination.page, typeFilter])

  const fetchMovements = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter)

      const res = await fetch(`/api/inventory/movements?${params}`)
      const data = await res.json()

      setMovements(data.movements || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }))
    } catch (error) {
      toast.error("Erreur lors du chargement des mouvements")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products/stock">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historique des Mouvements</h2>
          <p className="text-muted-foreground">
            Consultez l&apos;historique des mouvements de stock
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(MOVEMENT_TYPE_CONFIG).map(([value, config]) => (
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
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Entrepot</TableHead>
              <TableHead className="text-right">Quantite</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <History className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun mouvement enregistre
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => {
                const config = MOVEMENT_TYPE_CONFIG[movement.type] || {
                  label: movement.type,
                  color: "bg-gray-100 text-gray-800",
                  icon: RefreshCw,
                }
                const Icon = config.icon

                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(movement.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={config.color} variant="secondary">
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {movement.inventory.product.name}
                        </div>
                        {movement.inventory.variant && (
                          <div className="text-sm text-muted-foreground">
                            {movement.inventory.variant.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{movement.inventory.warehouse.name}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          movement.quantity >= 0
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {movement.quantity >= 0 ? "+" : ""}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.reason || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {movement.reference || "-"}
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
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} mouvements)
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
