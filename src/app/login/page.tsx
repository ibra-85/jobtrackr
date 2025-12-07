import { Suspense } from "react"
import { LoginForm } from "@/components/authentication/login-form"

function LoginFormWrapper() {
  return <LoginForm className="w-full max-w-sm" />
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={<div className="w-full max-w-sm">Chargement...</div>}>
        <LoginFormWrapper />
      </Suspense>
    </div>
  )
}

