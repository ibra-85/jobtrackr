"use client"

import { useSession as useBetterAuthSession } from "@/lib/auth/client"
import type { Session } from "@/lib/auth/types"

export function useSession() {
  const { data, isPending } = useBetterAuthSession()

  // Convertir la session Better Auth vers notre format Session
  // Better Auth retourne user dans data.user, pas dans data.session.user
  const session: Session | null = data?.session && data?.user
    ? {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: data.user.name || undefined,
          emailVerified: data.user.emailVerified ?? false,
        },
        expiresAt: data.session.expiresAt ? new Date(data.session.expiresAt) : undefined,
      }
    : null

  return { session, loading: isPending }
}



