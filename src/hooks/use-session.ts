 "use client"

import { useEffect, useState } from "react"

import { authAdapter } from "@/lib/auth"
import type { Session } from "@/lib/auth/types"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const s = await authAdapter.getSession()
        if (!cancelled) {
          setSession(s)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { session, loading }
}



