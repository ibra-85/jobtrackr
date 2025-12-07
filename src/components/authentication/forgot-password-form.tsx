"use client"

import React, { useState, useEffect, useRef } from "react"
import { Mail, Loader2, CheckCircle2, XCircle, Briefcase, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth/client"
import { getEmailValidationError } from "@/lib/validation/email"
import { getAuthErrorMessage } from "@/lib/auth/error-handler"
import { AuthBackground } from "./auth-background"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)

  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  useEffect(() => {
    if (!emailTouched) return
    
    if (email.length === 0) {
      setEmailError(null)
      return
    }

    const error = getEmailValidationError(email)
    setEmailError(error)
  }, [email, emailTouched])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setEmailTouched(true)

    const emailValidationError = getEmailValidationError(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      setError(emailValidationError)
      emailInputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message || "Erreur lors de l'envoi de l'email")
      }

      setSuccess(true)
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      setTimeout(() => emailInputRef.current?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  const isEmailValid = emailTouched && email.length > 0 && !emailError
  const isFormDisabled = loading || success

  if (success) {
    return (
      <>
        <AuthBackground />
        <div className={cn("flex flex-col gap-6 relative z-10", className)} {...props}>
          <div className="absolute -top-12 left-0 right-0 flex justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity"
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
          >
            <Card className="backdrop-blur-md bg-zinc-950/70 border-white/10 shadow-2xl">
              <CardHeader className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                  Email envoyé !
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Nous avons envoyé un lien de réinitialisation à {email}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-300 text-center">
                  Vérifie ta boîte de réception et clique sur le lien pour réinitialiser ton mot de passe.
                  Le lien expire dans 1 heure.
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <AuthBackground />
      <div className={cn("flex flex-col gap-6 relative z-10", className)} {...props}>
        <div className="absolute -top-12 left-0 right-0 flex justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 text-white hover:opacity-80 transition-opacity"
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
        >
          <Card className="backdrop-blur-md bg-zinc-950/70 border-white/10 shadow-2xl">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                Mot de passe oublié
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Entre ton email et nous t'enverrons un lien pour réinitialiser ton mot de passe
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Mail className="h-4 w-4 text-zinc-400" />
                    Email
                  </label>
                  <div className="relative">
                    <Input
                      ref={emailInputRef}
                      id="email"
                      type="email"
                      placeholder="email@exemple.fr"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setEmailTouched(true)
                        setError("")
                      }}
                      onBlur={() => setEmailTouched(true)}
                      disabled={isFormDisabled}
                      className={cn(
                        "pr-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-white/20 transition-all duration-200 hover:bg-zinc-900/70 disabled:opacity-50 disabled:cursor-not-allowed",
                        emailError && "border-red-500/50 focus-visible:border-red-500/50 focus-visible:ring-red-500/20",
                        isEmailValid && "border-green-500/50 focus-visible:border-green-500/50 focus-visible:ring-green-500/20"
                      )}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      aria-required="true"
                    />
                    <AnimatePresence>
                      {isEmailValid && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-400" aria-hidden="true" />
                        </motion.div>
                      )}
                      {emailError && emailTouched && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <XCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {emailError && emailTouched && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        id="email-error"
                        className="text-xs text-red-400"
                        role="alert"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {error && !emailError && (
                    <motion.div
                      ref={errorRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-md bg-red-500/10 border border-red-500/20 p-3"
                      role="alert"
                      tabIndex={-1}
                    >
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading || !!emailError || isFormDisabled}
                  className="w-full"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien de réinitialisation"
                  )}
                </Button>

                <p className="text-xs text-center text-zinc-500">
                  <Link href="/login" className="text-white hover:text-primary hover:underline transition-colors font-medium">
                    <ArrowLeft className="inline h-3 w-3 mr-1" />
                    Retour à la connexion
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}

