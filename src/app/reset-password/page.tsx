"use client"

import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/authentication/reset-password-form"

function ResetPasswordContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <ResetPasswordForm />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

