"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
  Sparkles,
  Plus,
  Trash2,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface GeminiConfig {
  id: string
  name: string
  description: string | null
  model: string
  temperature: number
  maxTokens: number
  isActive: boolean
  createdAt: string
  usageCount: number
}

const GEMINI_MODELS = [
  { value: "GEMINI_2_5_FLASH", label: "Gemini 2.5 Flash", description: "Fast and efficient" },
  { value: "GEMINI_2_5_PRO", label: "Gemini 2.5 Pro", description: "Most capable" },
  { value: "GEMINI_2_0_FLASH", label: "Gemini 2.0 Flash", description: "Previous generation" },
  { value: "GEMINI_1_5_FLASH", label: "Gemini 1.5 Flash", description: "Legacy fast model" },
  { value: "GEMINI_1_5_PRO", label: "Gemini 1.5 Pro", description: "Legacy pro model" },
]

export default function AISettingsPage() {
  const [configs, setConfigs] = useState<GeminiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; time?: number } | null>(null)

  // New config form state
  const [showForm, setShowForm] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    apiKey: "",
    model: "GEMINI_2_5_FLASH",
    temperature: 0.7,
    maxTokens: 2048,
    isActive: true,
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/gemini/config")
      const data = await res.json()
      if (data.success) {
        setConfigs(data.configs)
      }
    } catch (error) {
      toast.error("Failed to load configurations")
    } finally {
      setLoading(false)
    }
  }

  async function createConfig() {
    if (!formData.name.trim() || !formData.apiKey.trim()) {
      toast.error("Name and API key are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/gemini/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create configuration")
      }

      toast.success("Configuration created successfully")
      setShowForm(false)
      setFormData({
        name: "",
        description: "",
        apiKey: "",
        model: "GEMINI_2_5_FLASH",
        temperature: 0.7,
        maxTokens: 2048,
        isActive: true,
      })
      fetchConfigs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create configuration")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch("/api/gemini/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      })

      if (!res.ok) throw new Error("Failed to update")

      toast.success(isActive ? "Configuration activated" : "Configuration deactivated")
      fetchConfigs()
    } catch (error) {
      toast.error("Failed to update configuration")
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm("Are you sure you want to delete this configuration?")) return

    try {
      const res = await fetch(`/api/gemini/config?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      toast.success("Configuration deleted")
      fetchConfigs()
    } catch (error) {
      toast.error("Failed to delete configuration")
    }
  }

  async function testConnection(configId?: string) {
    const id = configId || "new"
    setTesting(id)
    setTestResult(null)

    try {
      const res = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          configId ? { configId } : { apiKey: formData.apiKey, model: formData.model }
        ),
      })

      const data = await res.json()

      setTestResult({
        id,
        success: data.success,
        time: data.responseTime,
      })

      if (data.success) {
        toast.success(`Connection successful (${data.responseTime}ms)`)
      } else {
        toast.error(data.error || "Connection failed")
      }
    } catch (error) {
      setTestResult({ id, success: false })
      toast.error("Connection test failed")
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage Google Gemini API keys for SEO generation
          </p>
        </div>
      </div>

      {/* Active Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {configs.some((c) => c.isActive) ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span>AI features are enabled</span>
              <Badge variant="outline" className="ml-2">
                {configs.find((c) => c.isActive)?.name}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-5 w-5" />
              <span>No active configuration. Add an API key to enable AI features.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Configuration */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add API Configuration
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>New Gemini Configuration</CardTitle>
            <CardDescription>
              Add your Google Gemini API key to enable AI-powered SEO generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production API Key"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">Gemini API Key *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => testConnection()}
                  disabled={!formData.apiKey || testing === "new"}
                >
                  {testing === "new" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  <span className="ml-2">Test</span>
                </Button>
              </div>
              {testResult?.id === "new" && (
                <p className={`text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                  {testResult.success
                    ? `✓ Connection successful (${testResult.time}ms)`
                    : "✗ Connection failed - check your API key"}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GEMINI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={256}
                  max={32000}
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 2048 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature: {formData.temperature.toFixed(1)}</Label>
                <span className="text-sm text-muted-foreground">
                  {formData.temperature < 0.3
                    ? "More focused"
                    : formData.temperature > 0.7
                    ? "More creative"
                    : "Balanced"}
                </span>
              </div>
              <Slider
                value={[formData.temperature]}
                onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Set as Active</Label>
                <p className="text-sm text-muted-foreground">
                  Use this configuration for AI features
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={createConfig} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Configurations */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configurations</CardTitle>
            <CardDescription>Manage your Gemini API configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    config.isActive ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.name}</span>
                      {config.isActive && <Badge>Active</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span>Model: {config.model.replace(/_/g, " ")}</span>
                      <span>Temperature: {config.temperature}</span>
                      <span>Usage: {config.usageCount} requests</span>
                    </div>
                    {config.description && (
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection(config.id)}
                      disabled={testing === config.id}
                    >
                      {testing === config.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : testResult?.id === config.id ? (
                        testResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>

                    <Switch
                      checked={config.isActive}
                      onCheckedChange={(checked) => toggleActive(config.id, checked)}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About AI Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <h4 className="font-medium">Product SEO</h4>
              <p className="text-sm text-muted-foreground">
                Generate optimized titles and descriptions for products
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Category SEO</h4>
              <p className="text-sm text-muted-foreground">
                Create SEO content for product categories
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Batch Generation</h4>
              <p className="text-sm text-muted-foreground">
                Generate SEO for multiple products at once
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
