"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Mail, Loader2, ArrowLeft } from "lucide-react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/5">
    {children}
  </div>
)

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const errorParam = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "code">("email")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "missing_token":
        return "Lien invalide"
      case "invalid_or_expired_token":
        return "Le code a expire ou est invalide. Veuillez en demander un nouveau."
      case "verification_failed":
        return "La verification a echoue. Veuillez reessayer."
      default:
        return null
    }
  }

  const urlErrorMessage = getErrorMessage(errorParam)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Une erreur est survenue")
      } else {
        setStep("code")
      }
    } catch {
      setError("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (value: string) => {
    if (value.length !== 4) return

    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/magic-link/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: value }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Code invalide")
        setCode("")
        setIsLoading(false)
        return
      }

      // Sign in the user
      const result = await signIn("credentials", {
        email,
        magicLinkVerified: "true",
        redirect: false,
      })

      if (result?.error) {
        setError("Erreur de connexion")
        setIsLoading(false)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("Une erreur est survenue")
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setStep("email")
    setCode("")
    setError("")
  }

  const handleResendCode = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Une erreur est survenue")
      }
    } catch {
      setError("Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "code") {
    return (
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <button
            onClick={handleReset}
            className="animate-element animate-delay-100 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="animate-element animate-delay-200 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h1 className="animate-element animate-delay-300 text-3xl md:text-4xl font-semibold leading-tight text-center">
            Verifiez votre email
          </h1>

          <p className="animate-element animate-delay-400 text-muted-foreground text-center">
            Nous avons envoye un code a 4 chiffres a
          </p>
          <p className="animate-element animate-delay-400 font-medium text-foreground text-center -mt-4">
            {email}
          </p>

          {error && (
            <div className="animate-element animate-delay-500 bg-destructive/15 text-destructive text-sm p-4 rounded-2xl text-center">
              {error}
            </div>
          )}

          <div className="animate-element animate-delay-500 flex justify-center">
            <InputOTP
              maxLength={4}
              value={code}
              onChange={(value) => {
                setCode(value)
                if (value.length === 4) {
                  handleVerifyCode(value)
                }
              }}
              disabled={isLoading}
            >
              <InputOTPGroup className="gap-3">
                <InputOTPSlot index={0} className="w-14 h-14 text-2xl rounded-xl border-border" />
                <InputOTPSlot index={1} className="w-14 h-14 text-2xl rounded-xl border-border" />
                <InputOTPSlot index={2} className="w-14 h-14 text-2xl rounded-xl border-border" />
                <InputOTPSlot index={3} className="w-14 h-14 text-2xl rounded-xl border-border" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isLoading && (
            <div className="animate-element animate-delay-600 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          <p className="animate-element animate-delay-700 text-center text-sm text-muted-foreground">
            Vous n&apos;avez pas recu le code ?{" "}
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-primary hover:underline transition-colors disabled:opacity-50"
            >
              Renvoyer
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-6">
        <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
          <span className="font-light text-foreground tracking-tighter">Connexion</span>
        </h1>
        <p className="animate-element animate-delay-200 text-muted-foreground">
          Entrez votre email pour recevoir un code de connexion
        </p>

        <form className="space-y-5" onSubmit={handleSendCode}>
          {(error || urlErrorMessage) && (
            <div className="animate-element animate-delay-300 bg-destructive/15 text-destructive text-sm p-4 rounded-2xl">
              {error || urlErrorMessage}
            </div>
          )}

          <div className="animate-element animate-delay-300">
            <label className="text-sm font-medium text-muted-foreground">
              Adresse email
            </label>
            <GlassInputWrapper>
              <input
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
              />
            </GlassInputWrapper>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="animate-element animate-delay-400 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Envoyer le code
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light text-foreground tracking-tighter">Connexion</span>
            </h1>
            <p className="text-muted-foreground">
              Entrez votre email pour recevoir un code de connexion
            </p>
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
