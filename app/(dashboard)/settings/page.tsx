"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Copy, Plus, Trash2, Key, CreditCard, Settings2, Upload, X, ImageIcon, Sparkles } from "lucide-react"
import Link from "next/link"
import { CURRENCIES } from "@/lib/currencies"

interface StoreSettings {
  id: string
  storeName: string
  storeLogo: string | null
  storeFavicon: string | null
  storeUrl: string | null
  currency: string
  stripePublishableKey: string | null
  stripeSecretKey: string | null
  stripeWebhookSecret: string | null
  stripeEnabled: boolean
}

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newApiKeyName, setNewApiKeyName] = useState("")
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchApiKeys()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function fetchApiKeys() {
    try {
      const res = await fetch("/api/settings/api-keys")
      const data = await res.json()
      setApiKeys(data)
    } catch (error) {
      console.error("Failed to load API keys:", error)
    }
  }

  async function saveSettings() {
    if (!settings) return

    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast.success("Settings saved successfully")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function createApiKey() {
    if (!newApiKeyName.trim()) {
      toast.error("Please enter a name for the API key")
      return
    }

    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newApiKeyName,
          permissions: ["read", "checkout", "webhooks"],
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setNewApiKey(data.rawKey)
      setNewApiKeyName("")
      fetchApiKeys()
      toast.success("API key created! Copy it now - it won't be shown again.")
    } catch (error) {
      toast.error("Failed to create API key")
    }
  }

  async function deleteApiKey(id: string) {
    if (!confirm("Are you sure you want to delete this API key?")) return

    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      fetchApiKeys()
      toast.success("API key deleted")
    } catch (error) {
      toast.error("Failed to delete API key")
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setUploadingLogo(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        const res = await fetch("/api/settings/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload")
        }

        setSettings((prev) => prev ? { ...prev, storeLogo: data.url } : null)
        toast.success("Logo uploaded successfully")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function removeLogo() {
    try {
      const res = await fetch("/api/settings/logo", {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove")

      setSettings((prev) => prev ? { ...prev, storeLogo: null } : null)
      toast.success("Logo removed")
    } catch (error) {
      toast.error("Failed to remove logo")
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Favicon must be less than 1MB")
      return
    }

    setUploadingFavicon(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string

        const res = await fetch("/api/settings/favicon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to upload")
        }

        setSettings((prev) => prev ? { ...prev, storeFavicon: data.url } : null)
        toast.success("Favicon uploaded successfully")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error("Failed to upload favicon")
    } finally {
      setUploadingFavicon(false)
    }
  }

  async function removeFavicon() {
    try {
      const res = await fetch("/api/settings/favicon", {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to remove")

      setSettings((prev) => prev ? { ...prev, storeFavicon: null } : null)
      toast.success("Favicon removed")
    } catch (error) {
      toast.error("Failed to remove favicon")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration and integrations</p>
      </div>

      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2" asChild>
            <Link href="/settings/ai">
              <Sparkles className="h-4 w-4" />
              AI / Gemini
            </Link>
          </TabsTrigger>
        </TabsList>

        {/* Stripe Configuration */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stripe Configuration</CardTitle>
                  <CardDescription>Stripe keys are configured via environment variables</CardDescription>
                </div>
                <Badge variant={settings?.stripeEnabled ? "default" : "secondary"}>
                  {settings?.stripeEnabled ? "Active" : "Not Configured"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Stripe API keys are managed through environment variables for security.
                  Update them in your <code className="bg-muted px-1 rounded">.env</code> file.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Publishable Key</span>
                    <Badge variant={settings?.stripePublishableKey ? "outline" : "secondary"}>
                      {settings?.stripePublishableKey ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Secret Key</span>
                    <Badge variant={settings?.stripeSecretKey ? "outline" : "secondary"}>
                      {settings?.stripeSecretKey ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">Webhook Secret</span>
                    <Badge variant={settings?.stripeWebhookSecret ? "outline" : "secondary"}>
                      {settings?.stripeWebhookSecret ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={typeof window !== "undefined" ? `${window.location.origin}/api/external/webhooks/stripe` : ""}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(typeof window !== "undefined" ? `${window.location.origin}/api/external/webhooks/stripe` : "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this URL to your Stripe dashboard webhook settings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage API keys for external applications like your landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New API Key Alert */}
              {newApiKey && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    New API Key Created - Copy it now!
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-white dark:bg-black p-2 rounded border text-sm break-all">
                      {newApiKey}
                    </code>
                    <Button size="icon" onClick={() => copyToClipboard(newApiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    This key will not be shown again. Store it securely.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setNewApiKey(null)}>
                    Dismiss
                  </Button>
                </div>
              )}

              {/* Create New Key */}
              <div className="flex gap-2">
                <Input
                  placeholder="API key name (e.g., techavor-store)"
                  value={newApiKeyName}
                  onChange={(e) => setNewApiKeyName(e.target.value)}
                />
                <Button onClick={createApiKey}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Key
                </Button>
              </div>

              {/* API Keys List */}
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant={key.isActive ? "default" : "secondary"}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <code>{key.keyPrefix}...</code>
                        {key.lastUsedAt && (
                          <span className="ml-2">
                            Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {apiKeys.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No API keys yet. Create one to connect your landing page.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic store configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden flex items-center justify-center bg-muted/50">
                    {settings?.storeLogo ? (
                      <>
                        <img
                          src={settings.storeLogo}
                          alt="Store Logo"
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                      disabled={uploadingLogo}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 512x512px, PNG or SVG. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-start gap-4">
                  <div className="relative w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden flex items-center justify-center bg-muted/50">
                    {settings?.storeFavicon ? (
                      <>
                        <img
                          src={settings.storeFavicon}
                          alt="Favicon"
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={removeFavicon}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml"
                      onChange={handleFaviconUpload}
                      className="hidden"
                      id="favicon-upload"
                      disabled={uploadingFavicon}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("favicon-upload")?.click()}
                      disabled={uploadingFavicon}
                    >
                      {uploadingFavicon ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Favicon
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Recommended: 32x32px or 64x64px, PNG or ICO. Max 1MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={settings?.storeName || ""}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, storeName: e.target.value } : null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-url">Store URL</Label>
                <Input
                  id="store-url"
                  placeholder="https://your-store.com"
                  value={settings?.storeUrl || ""}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, storeUrl: e.target.value } : null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings?.currency || "USD"}
                  onValueChange={(value) =>
                    setSettings((prev) => prev ? { ...prev, currency: value } : null)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-muted-foreground">
                            {currency.symbol} - {currency.name}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={saveSettings} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
