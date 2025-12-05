"use client"

import { SignupForm } from "@/components/authentication/signup-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SignupForm className="w-full max-w-sm" />
    </div>
  )
}

