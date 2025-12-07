"use client"

import { ForgotPasswordForm } from "@/components/authentication/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <ForgotPasswordForm />
    </div>
  )
}

