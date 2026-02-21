"use client"

import { useEffect } from "react"

const DEFAULT_FAVICON = "/default-favicon.svg"

interface FaviconUpdaterProps {
  faviconUrl?: string | null
}

export function FaviconUpdater({ faviconUrl }: FaviconUpdaterProps) {
  useEffect(() => {
    const url = faviconUrl || DEFAULT_FAVICON

    // Find existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']")

    // Remove existing favicons
    existingLinks.forEach(link => link.remove())

    // Create new favicon link
    const link = document.createElement("link")
    link.rel = "icon"
    link.href = url
    document.head.appendChild(link)

    // Also add apple-touch-icon for iOS
    const appleLink = document.createElement("link")
    appleLink.rel = "apple-touch-icon"
    appleLink.href = url
    document.head.appendChild(appleLink)

    return () => {
      // Cleanup on unmount
      link.remove()
      appleLink.remove()
    }
  }, [faviconUrl])

  return null
}
