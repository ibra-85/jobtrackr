import { Suspense } from "react"
import { SignupForm } from "@/components/authentication/signup-form"

function SignupFormWrapper() {
  return <SignupForm className="w-full max-w-md" />
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="w-full max-w-md">Chargement...</div>}>
        <SignupFormWrapper />
      </Suspense>
    </div>
  )
}
