"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, Briefcase, Mail, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { AuthBackground } from "./auth-background"

export function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")
  const email = searchParams.get("email")
  const callbackURL = searchParams.get("callbackURL") || "/dashboard"

  const [status, setStatus] = useState<"pending" | "loading" | "success" | "error">(
    errorParam ? "error" : token ? "loading" : email ? "pending" : "error"
  )
  const [error, setError] = useState(
    errorParam === "invalid_token" ? "Le lien de vérification est invalide ou a expiré." : ""
  )
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (token && !errorParam) {
      // Better Auth vérifie automatiquement le token via l'URL
      // On attend un peu pour voir si la redirection se fait
      const timer = setTimeout(() => {
        setStatus("success")
        setTimeout(() => {
          router.push(callbackURL)
        }, 2000)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (errorParam) {
      setStatus("error")
      setError("Le lien de vérification est invalide ou a expiré.")
    } else if (!email) {
      setStatus("error")
      setError("Email manquant.")
    }
  }, [token, errorParam, callbackURL, router, email])

  // Détecter le provider email depuis l'adresse
  const getEmailProvider = (email: string) => {
    if (!email) return null
    const domain = email.split("@")[1]?.toLowerCase()
    if (domain?.includes("gmail")) return "gmail"
    if (domain?.includes("outlook") || domain?.includes("hotmail") || domain?.includes("live")) return "outlook"
    if (domain?.includes("yahoo")) return "yahoo"
    return null
  }

  const emailProvider = email ? getEmailProvider(email) : null

  const openEmailProvider = () => {
    if (!emailProvider) {
      // Ouvrir un client email générique
      window.location.href = `mailto:${email}`
      return
    }

    const emailMap: Record<string, string> = {
      gmail: "https://mail.google.com",
      outlook: "https://outlook.live.com",
      yahoo: "https://mail.yahoo.com",
    }

    window.open(emailMap[emailProvider], "_blank")
  }

  return (
    <>
      <AuthBackground />
      <div className="flex flex-col gap-6 relative z-10 items-center justify-center p-4">
        <div className="absolute -top-12 left-0 right-0 flex justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity z-20"
            aria-label="Retour à l'accueil"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xl font-bold">JobTrackr</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-lg"
        >
          <Card className="backdrop-blur-md bg-zinc-950/70 border-white/10 shadow-2xl">
            <CardHeader className="text-center space-y-4 pb-6">
              {status === "pending" && (
                <>
                  {/* Icône de vérification avec badge/shield */}
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                      <div className="relative bg-zinc-800/80 border border-primary/30 p-3 rounded-full">
                        <ShieldCheck className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                      Tu es prêt !
                    </CardTitle>
                    <CardTitle className="text-xl font-semibold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                      Vérifie ton email pour commencer.
                    </CardTitle>
                  </div>

                  <CardDescription className="text-zinc-400 text-base leading-relaxed pt-2">
                    Vérifie ta boîte de réception{" "}
                    <span className="font-semibold text-white">{email}</span>{" "}
                    et clique sur le bouton{" "}
                    <span className="font-semibold text-primary">&quot;Vérifier mon email&quot;</span>{" "}
                    pour finaliser ton inscription.
                  </CardDescription>
                </>
              )}

              {status === "loading" && (
                <>
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                    Vérification en cours...
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Nous vérifions ton adresse email
                  </CardDescription>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl" />
                      <div className="relative bg-green-500 p-4 rounded-full">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                    Email vérifié !
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Redirection vers ton tableau de bord...
                  </CardDescription>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl" />
                      <div className="relative bg-red-500 p-4 rounded-full">
                        <XCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                    Erreur de vérification
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {error || "Une erreur est survenue lors de la vérification"}
                  </CardDescription>
                </>
              )}
            </CardHeader>

            {(status === "pending" || status === "error") && (
              <CardContent className="space-y-4 pt-0">
                {status === "pending" && emailProvider && (
                  <Button
                    onClick={openEmailProvider}
                    className="w-full font-medium h-12"
                    variant="outline"
                  >
                    <div className="flex items-center gap-3 w-full justify-center">
                      {emailProvider === "gmail" && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                          />
                        </svg>
                      )}
                      {emailProvider === "outlook" && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0078D4">
                          <path d="M7.5 11.5L0 7v10l7.5-4.5v-1zM24 7v10l-7.5-4.5v-1L24 7zM12 6.5L7.5 4 12 6.5 16.5 4 12 6.5zM12 11.5L7.5 9v4.5L12 11.5zm0 0L16.5 9v4.5L12 11.5z" />
                        </svg>
                      )}
                      {emailProvider === "yahoo" && (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#6001D2">
                          <path d="M12 0L0 12l4 4 8-8 8 8 4-4L12 0z" />
                        </svg>
                      )}
                      <span>Ouvrir {emailProvider === "gmail" ? "Gmail" : emailProvider === "outlook" ? "Outlook" : "Yahoo Mail"}</span>
                    </div>
                  </Button>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      if (email) {
                        try {
                          await authClient.sendVerificationEmail({
                            email,
                            callbackURL: callbackURL,
                          })
                          setEmailSent(true)
                        } catch (err: any) {
                          // En mode test Resend, on ne peut envoyer qu'à sa propre adresse
                          if (err?.statusCode === 403) {
                            setError(
                              "En mode test, Resend n'autorise l'envoi qu'à votre adresse email vérifiée. " +
                              "Pour envoyer à d'autres adresses, vérifiez un domaine sur resend.com/domains"
                            )
                          } else {
                            setError("Erreur lors de l'envoi de l'email. Réessaie plus tard.")
                          }
                        }
                      }
                    }}
                    className="w-full"
                    variant="outline"
                    disabled={emailSent}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {emailSent ? "Email envoyé !" : "Renvoyer l'email de vérification"}
                  </Button>
                </div>

                {status === "error" && (
                  <Button
                    onClick={() => router.push("/login")}
                    className="w-full mt-4"
                    variant="ghost"
                  >
                    Retour à la connexion
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  )
}

