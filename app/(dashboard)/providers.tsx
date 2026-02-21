"use client"

import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect, createContext, useContext } from "react"
import { FaviconUpdater } from "@/components/favicon-updater"

interface StoreSettingsContextType {
  currency: string
  storeName: string | null
  isLoading: boolean
}

const StoreSettingsContext = createContext<StoreSettingsContextType>({
  currency: "MAD",
  storeName: null,
  isLoading: true,
})

export function useStoreSettings() {
  return useContext(StoreSettingsContext)
}

function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [currency, setCurrency] = useState("MAD")
  const [storeName, setStoreName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setFaviconUrl(data.storeFavicon)
          setCurrency(data.currency || "MAD")
          setStoreName(data.storeName)
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  return (
    <StoreSettingsContext.Provider value={{ currency, storeName, isLoading }}>
      <FaviconUpdater faviconUrl={faviconUrl} />
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <StoreSettingsProvider>
          {children}
        </StoreSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
