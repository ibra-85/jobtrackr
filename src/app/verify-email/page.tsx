"use client"

import { Suspense } from "react"
import { VerifyEmailPage } from "@/components/authentication/verify-email-page"

function VerifyEmailContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <VerifyEmailPage />
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

