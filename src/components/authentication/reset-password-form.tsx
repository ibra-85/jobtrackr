"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Lock, Check, X, Briefcase, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth/client"
import {
  calculatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordRequirements,
} from "@/lib/validation/password"
import { getAuthErrorMessage } from "@/lib/auth/error-handler"
import { AuthBackground } from "./auth-background"

const PASSWORD_REQUIREMENTS_LABELS: Record<keyof PasswordRequirements, string> = {
  length: "Au moins 8 caractères",
  uppercase: "Au moins 1 lettre majuscule",
  lowercase: "Au moins 1 lettre minuscule",
  number: "Au moins 1 chiffre",
  special: "Au moins 1 caractère spécial",
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const errorParam = searchParams.get("error")

  const passwordInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState(errorParam === "INVALID_TOKEN" ? "Le lien de réinitialisation est invalide ou a expiré." : "")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [passwordTouched, setPasswordTouched] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token manquant. Vérifie que tu as bien cliqué sur le lien dans l'email.")
    }
    passwordInputRef.current?.focus()
  }, [token])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  )

  const confirmPasswordError =
    passwordTouched && confirmPassword.length > 0 && password !== confirmPassword
      ? "Les mots de passe ne correspondent pas"
      : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPasswordTouched(true)

    if (!token) {
      setError("Token manquant. Vérifie que tu as bien cliqué sur le lien dans l'email.")
      return
    }

    if (!passwordStrength.allMet) {
      setError("Le mot de passe ne respecte pas tous les critères requis.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (error) {
        throw new Error(error.message || "Erreur lors de la réinitialisation")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err)
      setError(errorMessage)
      setTimeout(() => passwordInputRef.current?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  const showPasswordStrength = passwordTouched && password.length > 0
  const isFormDisabled = loading || success || !token

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
                  Mot de passe réinitialisé !
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Redirection vers la page de connexion...
                </CardDescription>
              </CardHeader>
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
                Nouveau mot de passe
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Choisis un nouveau mot de passe sécurisé
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Lock className="h-4 w-4 text-zinc-400" />
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      ref={passwordInputRef}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordTouched(true)
                        setError("")
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      disabled={isFormDisabled}
                      className="pr-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-white/20 transition-all duration-200 hover:bg-zinc-900/70 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      disabled={isFormDisabled}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showPasswordStrength && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Force du mot de passe</span>
                            <span
                              className={cn(
                                "font-medium",
                                passwordStrength.strength === "weak" && "text-red-400",
                                passwordStrength.strength === "medium" && "text-orange-400",
                                passwordStrength.strength === "strong" && "text-yellow-400",
                                passwordStrength.strength === "very-strong" && "text-green-400"
                              )}
                            >
                              {getPasswordStrengthLabel(passwordStrength.strength)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-800/50 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "h-full rounded-full transition-colors",
                                getPasswordStrengthColor(passwordStrength.strength)
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 text-xs"
                            >
                              {met ? (
                                <Check className="h-3.5 w-3.5 text-green-400" aria-hidden="true" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                              )}
                              <span
                                className={cn(
                                  met ? "text-green-400" : "text-zinc-400"
                                )}
                              >
                                {PASSWORD_REQUIREMENTS_LABELS[key as keyof PasswordRequirements]}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                    <Lock className="h-4 w-4 text-zinc-400" />
                    Confirme le mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setPasswordTouched(true)
                        setError("")
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      disabled={isFormDisabled}
                      className={cn(
                        "pr-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:border-white/20 focus-visible:ring-white/20 transition-all duration-200 hover:bg-zinc-900/70 disabled:opacity-50 disabled:cursor-not-allowed",
                        confirmPasswordError && "border-red-500/50 focus-visible:border-red-500/50 focus-visible:ring-red-500/20",
                        passwordTouched &&
                          confirmPassword.length > 0 &&
                          !confirmPasswordError &&
                          "border-green-500/50 focus-visible:border-green-500/50 focus-visible:ring-green-500/20"
                      )}
                      aria-invalid={!!confirmPasswordError}
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      disabled={isFormDisabled}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={
                        showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <AnimatePresence>
                      {passwordTouched &&
                        confirmPassword.length > 0 &&
                        !confirmPasswordError && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-400" aria-hidden="true" />
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {confirmPasswordError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-red-400"
                        role="alert"
                      >
                        {confirmPasswordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {error && !confirmPasswordError && (
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
                  disabled={loading || !passwordStrength.allMet || !!confirmPasswordError || isFormDisabled}
                  className="w-full"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Réinitialisation...
                    </>
                  ) : (
                    "Réinitialiser le mot de passe"
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

