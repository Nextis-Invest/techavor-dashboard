"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { ArrowLeft, Save, Plus, X, Loader2, Globe } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ImageUploader, UploadedImage } from "@/components/ui/image-uploader"
import { useStoreSettings } from "../../providers"

interface Category {
  id: string
  name: string
}

interface ProductAttribute {
  id?: string
  name: string
  value: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const { currency } = useStoreSettings()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    categoryId: "",
    status: "DRAFT",
    featured: false,
    trending: false,
    newArrival: false,
    bestSeller: false,
    taxable: true,
    taxRate: "20",
    weight: "",
    weightUnit: "g",
    metaTitle: "",
    metaDescription: "",
  })
  const [images, setImages] = useState<UploadedImage[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])

  useEffect(() => {
    fetchCategories()
    fetchProduct()
  }, [productId])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?activeOnly=true")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Produit non trouve")
      }

      const product = data.product
      setFormData({
        name: product.name || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        price: product.price?.toString() || "",
        compareAtPrice: product.compareAtPrice?.toString() || "",
        costPrice: product.costPrice?.toString() || "",
        categoryId: product.categoryId || "",
        status: product.status || "DRAFT",
        featured: product.featured || false,
        trending: product.trending || false,
        newArrival: product.newArrival || false,
        bestSeller: product.bestSeller || false,
        taxable: product.taxable ?? true,
        taxRate: product.taxRate?.toString() || "20",
        weight: product.weight?.toString() || "",
        weightUnit: product.weightUnit || "g",
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
      })
      setImages(
        product.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText || "",
        })) || []
      )
      setAttributes(
        product.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          value: attr.value,
        })) || []
      )
    } catch (error: any) {
      toast.error(error.message)
      router.push("/products")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        taxRate: parseFloat(formData.taxRate) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: images.map((img) => ({ url: img.url, altText: img.altText })),
        attributes: attributes.filter((a) => a.name && a.value),
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue")
      }

      toast.success("Produit mis a jour avec succes")
      router.push("/products")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addAttribute = () => {
    setAttributes([...attributes, { name: "", value: "" }])
  }

  const updateAttribute = (index: number, field: "name" | "value", value: string) => {
    const updated = [...attributes]
    updated[index][field] = value
    setAttributes(updated)
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modifier le Produit</h2>
          <p className="text-muted-foreground">
            Modifiez les informations du produit
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations Generales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Description courte</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>
                  Gerez les images de votre produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  maxImages={10}
                  productName={formData.name}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix de vente ({currency}) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, price: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Prix compare ({currency})</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      value={formData.compareAtPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, compareAtPrice: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Prix d&apos;achat ({currency})</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, costPrice: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/products/${productId}/pricing`}>
                      <Globe className="mr-2 h-4 w-4" />
                      Manage Regional Pricing
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attributs</CardTitle>
                <CardDescription>
                  Gerez les attributs personnalises
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Nom"
                      value={attr.name}
                      onChange={(e) => updateAttribute(index, "name", e.target.value)}
                    />
                    <Input
                      placeholder="Valeur"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttribute(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAttribute}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un attribut
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
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
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                      <SelectItem value="ARCHIVED">Archive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categorie *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoryId: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionnez une categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mise en avant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">En vedette</Label>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, featured: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="trending">Tendance</Label>
                  <Switch
                    id="trending"
                    checked={formData.trending}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, trending: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newArrival">Nouveaute</Label>
                  <Switch
                    id="newArrival"
                    checked={formData.newArrival}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, newArrival: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bestSeller">Best-seller</Label>
                  <Switch
                    id="bestSeller"
                    checked={formData.bestSeller}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, bestSeller: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expedition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Poids</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, weight: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightUnit">Unite</Label>
                    <Select
                      value={formData.weightUnit}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, weightUnit: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grammes</SelectItem>
                        <SelectItem value="kg">Kilogrammes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta titre</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/products">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
