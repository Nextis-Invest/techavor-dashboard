"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, Save, Loader2, Globe } from "lucide-react"
import Link from "next/link"

interface RegionalPrice {
  regionId: string
  regionCode: string
  regionName: string
  currency: string
  isDefault: boolean
  price: number | null
  compareAtPrice: number | null
}

interface ProductPricing {
  product: {
    id: string
    name: string
    basePrice: number
    baseCompareAtPrice: number | null
  }
  regionalPrices: RegionalPrice[]
}

export default function ProductPricingPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<ProductPricing | null>(null)
  const [prices, setPrices] = useState<Record<string, { price: string; compareAtPrice: string }>>({})

  useEffect(() => {
    fetchPricing()
  }, [productId])

  async function fetchPricing() {
    try {
      const res = await fetch(`/api/products/${productId}/prices`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to fetch pricing")
      }

      setData(result)

      // Initialize form state from data
      const initialPrices: Record<string, { price: string; compareAtPrice: string }> = {}
      result.regionalPrices.forEach((rp: RegionalPrice) => {
        initialPrices[rp.regionId] = {
          price: rp.price !== null ? rp.price.toString() : "",
          compareAtPrice: rp.compareAtPrice !== null ? rp.compareAtPrice.toString() : "",
        }
      })
      setPrices(initialPrices)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pricing")
      router.push(`/products/${productId}`)
    } finally {
      setLoading(false)
    }
  }

  function updatePrice(regionId: string, field: "price" | "compareAtPrice", value: string) {
    setPrices((prev) => ({
      ...prev,
      [regionId]: {
        ...prev[regionId],
        [field]: value,
      },
    }))
  }

  async function savePricing() {
    if (!data) return

    setSaving(true)
    try {
      // Transform prices for API
      const pricesArray = data.regionalPrices.map((rp) => {
        const regionPrices = prices[rp.regionId]
        const priceValue = regionPrices?.price ? parseFloat(regionPrices.price) : null
        const compareAtValue = regionPrices?.compareAtPrice ? parseFloat(regionPrices.compareAtPrice) : null

        return {
          regionId: rp.regionId,
          price: priceValue,
          compareAtPrice: compareAtValue,
        }
      })

      const res = await fetch(`/api/products/${productId}/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: pricesArray }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || "Failed to save pricing")
      }

      toast.success("Regional prices saved successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save pricing")
    } finally {
      setSaving(false)
    }
  }

  function copyBasePrice(regionId: string) {
    if (!data) return
    setPrices((prev) => ({
      ...prev,
      [regionId]: {
        price: data.product.basePrice.toString(),
        compareAtPrice: data.product.baseCompareAtPrice?.toString() || "",
      },
    }))
  }

  function clearPrice(regionId: string) {
    setPrices((prev) => ({
      ...prev,
      [regionId]: {
        price: "",
        compareAtPrice: "",
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/products/${productId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Regional Pricing</h1>
            <p className="text-muted-foreground">{data.product.name}</p>
          </div>
        </div>
        <Button onClick={savePricing} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Prices
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Base Price</CardTitle>
          </div>
          <CardDescription>
            The default price used when no regional price is set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <Label className="text-muted-foreground text-sm">Price</Label>
              <p className="text-2xl font-bold">${data.product.basePrice.toFixed(2)}</p>
            </div>
            {data.product.baseCompareAtPrice && (
              <div>
                <Label className="text-muted-foreground text-sm">Compare At</Label>
                <p className="text-2xl font-bold text-muted-foreground line-through">
                  ${data.product.baseCompareAtPrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional Prices</CardTitle>
          <CardDescription>
            Set different prices for each region. Leave empty to use the base price.
            <Link href="/settings/pricing" className="text-primary hover:underline ml-1">
              Manage regions
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.regionalPrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pricing regions configured.</p>
              <Link href="/settings/pricing" className="text-primary hover:underline">
                Configure pricing regions first
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Compare At Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.regionalPrices.map((region) => (
                  <TableRow key={region.regionId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{region.regionName}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {region.regionCode}
                        </Badge>
                        {region.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{region.currency}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32"
                        placeholder="Base price"
                        value={prices[region.regionId]?.price || ""}
                        onChange={(e) => updatePrice(region.regionId, "price", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32"
                        placeholder="Optional"
                        value={prices[region.regionId]?.compareAtPrice || ""}
                        onChange={(e) => updatePrice(region.regionId, "compareAtPrice", e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyBasePrice(region.regionId)}
                        title="Copy base price"
                      >
                        Copy Base
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearPrice(region.regionId)}
                        title="Clear regional price"
                      >
                        Clear
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/products/${productId}`}>Cancel</Link>
        </Button>
        <Button onClick={savePricing} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Prices
        </Button>
      </div>
    </div>
  )
}
