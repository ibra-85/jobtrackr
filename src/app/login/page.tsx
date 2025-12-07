import { Suspense } from "react"
import { LoginForm } from "@/components/authentication/login-form"

function LoginFormWrapper() {
  return <LoginForm className="w-full max-w-md" />
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md">Chargement...</div>}>
        <LoginFormWrapper />
      </Suspense>
    </div>
  )
}
