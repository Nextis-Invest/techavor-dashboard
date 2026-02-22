"use client"

import { useEffect, useState } from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

interface StoreSettings {
  storeLogo: string | null
}

const DEFAULT_LOGO = "/techavor-logo.svg"

export function Logo({ size = "md", className }: LogoProps) {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [imageError, setImageError] = useState(false)

  const imageSizes = {
    sm: { width: 120, height: 28 },
    md: { width: 150, height: 36 },
    lg: { width: 180, height: 48 },
  }

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch settings for logo:", error)
      }
    }
    fetchSettings()
  }, [])

  // Use uploaded logo if available, otherwise use default
  const logoSrc = settings?.storeLogo && !imageError ? settings.storeLogo : DEFAULT_LOGO

  return (
    <div className={className}>
      <img
        src={logoSrc}
        alt="Store Logo"
        width={imageSizes[size].width}
        height={imageSizes[size].height}
        className="object-contain logo-monochrome"
        onError={() => {
          console.error("Failed to load logo from:", logoSrc)
          setImageError(true)
        }}
      />
    </div>
  )
}
