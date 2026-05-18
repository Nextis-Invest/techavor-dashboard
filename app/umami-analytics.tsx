"use client"

import { useEffect } from "react"

const WEBSITE_IDS = {
  "app.techavor.com": "f0eb41a0-6c27-4a2b-badd-01e6453c94a6",
  "www.app.techavor.com": "f0eb41a0-6c27-4a2b-badd-01e6453c94a6"
} as const

export function UmamiAnalytics() {
  useEffect(() => {
    const websiteId = WEBSITE_IDS[window.location.hostname as keyof typeof WEBSITE_IDS]

    if (!websiteId) {
      return
    }

    const existing = document.querySelector(
      `script[src="https://umami.nextis-ai.com/script.js"][data-website-id="${websiteId}"]`,
    )

    if (existing) {
      return
    }

    const script = document.createElement("script")
    script.defer = true
    script.src = "https://umami.nextis-ai.com/script.js"
    script.dataset.websiteId = websiteId
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return null
}
