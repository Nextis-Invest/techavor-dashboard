"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Globe, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { CURRENCIES } from "@/lib/currencies"

interface PricingRegion {
  id: string
  code: string
  name: string
  currency: string
  countries: string[]
  isDefault: boolean
  sortOrder: number
  _count?: {
    prices: number
  }
}

const COMMON_COUNTRIES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  CH: "Switzerland",
  LI: "Liechtenstein",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  AT: "Austria",
  PT: "Portugal",
  IE: "Ireland",
  FI: "Finland",
  SE: "Sweden",
  DK: "Denmark",
  PL: "Poland",
  CZ: "Czech Republic",
  GR: "Greece",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  HR: "Croatia",
  SK: "Slovakia",
  SI: "Slovenia",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  CY: "Cyprus",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  SG: "Singapore",
  HK: "Hong Kong",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  ZA: "South Africa",
}

export default function PricingSettingsPage() {
  const [regions, setRegions] = useState<PricingRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRegion, setEditingRegion] = useState<PricingRegion | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    currency: "USD",
    countries: [] as string[],
    isDefault: false,
    sortOrder: 0,
  })

  useEffect(() => {
    fetchRegions()
  }, [])

  async function fetchRegions() {
    try {
      const res = await fetch("/api/pricing-regions")
      const data = await res.json()
      setRegions(data.regions || [])
    } catch (error) {
      toast.error("Failed to load pricing regions")
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setEditingRegion(null)
    setFormData({
      code: "",
      name: "",
      currency: "USD",
      countries: [],
      isDefault: false,
      sortOrder: regions.length,
    })
    setDialogOpen(true)
  }

  function openEditDialog(region: PricingRegion) {
    setEditingRegion(region)
    setFormData({
      code: region.code,
      name: region.name,
      currency: region.currency,
      countries: region.countries,
      isDefault: region.isDefault,
      sortOrder: region.sortOrder,
    })
    setDialogOpen(true)
  }

  async function saveRegion() {
    if (!formData.code || !formData.name || !formData.currency) {
      toast.error("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const url = editingRegion
        ? `/api/pricing-regions/${editingRegion.id}`
        : "/api/pricing-regions"
      const method = editingRegion ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      toast.success(editingRegion ? "Region updated" : "Region created")
      setDialogOpen(false)
      fetchRegions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save region")
    } finally {
      setSaving(false)
    }
  }

  async function deleteRegion(region: PricingRegion) {
    if (region.isDefault) {
      toast.error("Cannot delete the default region")
      return
    }

    if (!confirm(`Delete region "${region.name}"? This will remove all associated prices.`)) {
      return
    }

    try {
      const res = await fetch(`/api/pricing-regions/${region.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }

      toast.success("Region deleted")
      fetchRegions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete region")
    }
  }

  function toggleCountry(countryCode: string) {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter((c) => c !== countryCode)
        : [...prev.countries, countryCode],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Pricing Regions</h1>
            <p className="text-muted-foreground">
              Manage regional pricing for different countries
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regions</CardTitle>
          <CardDescription>
            Define pricing regions with different currencies. Products can have different prices per region.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Products Priced</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No pricing regions configured. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-mono font-semibold">
                      {region.code}
                      {region.isDefault && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{region.name}</TableCell>
                    <TableCell>{region.currency}</TableCell>
                    <TableCell>
                      {region.countries.length === 0 ? (
                        <span className="text-muted-foreground">All others</span>
                      ) : (
                        <span className="text-sm">
                          {region.countries.slice(0, 3).join(", ")}
                          {region.countries.length > 3 && ` +${region.countries.length - 3} more`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{region._count?.prices ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(region)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRegion(region)}
                        disabled={region.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRegion ? "Edit Pricing Region" : "Create Pricing Region"}
            </DialogTitle>
            <DialogDescription>
              Define a region with its currency and included countries.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Region Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., US, EU, UK"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Region Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., United States, Europe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label htmlFor="isDefault">
                Default region (fallback for countries not in any other region)
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Countries in this Region</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select countries that belong to this pricing region. Leave empty for the default/fallback region.
              </p>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {Object.entries(COMMON_COUNTRIES).map(([code, name]) => (
                  <label
                    key={code}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-muted p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.countries.includes(code)}
                      onChange={() => toggleCountry(code)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {code} - {name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {formData.countries.length} countries
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRegion} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRegion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
