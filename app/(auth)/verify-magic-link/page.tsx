"use client"

import { Suspense, useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

function VerifyMagicLinkContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const callbackUrl = searchParams.get("callbackUrl") || "/my-project"

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Connexion en cours...")

  useEffect(() => {
    if (!email) {
      setStatus("error")
      setMessage("Email manquant")
      return
    }

    const authenticate = async () => {
      try {
        const result = await signIn("credentials", {
          email,
          magicLinkVerified: "true",
          redirect: false,
        })

        if (result?.error) {
          setStatus("error")
          setMessage("Erreur de connexion")
          setTimeout(() => router.push("/login"), 2000)
        } else {
          setStatus("success")
          setMessage("Connexion reussie!")
          setTimeout(() => {
            router.push(callbackUrl)
            router.refresh()
          }, 1000)
        }
      } catch {
        setStatus("error")
        setMessage("Une erreur est survenue")
        setTimeout(() => router.push("/login"), 2000)
      }
    }

    authenticate()
  }, [email, callbackUrl, router])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-green-600 font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirection en cours...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirection vers la page de connexion...
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      }
    >
      <VerifyMagicLinkContent />
    </Suspense>
  )
}
