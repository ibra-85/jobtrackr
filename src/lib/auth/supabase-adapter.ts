// Adapter Supabase implémentant l'interface générique d'auth.
// La logique réelle sera branchée une fois le client Supabase configuré.

import { supabase } from "@/lib/supabase-client"
import type { AuthAdapter, Session } from "./types"

export const supabaseAuthAdapter: AuthAdapter = {
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: (session.user.user_metadata as { name?: string } | null)?.name,
      },
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    }
  },

  async signInWithEmail(params: { email: string; password: string }): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (error) {
      throw error
    }
  },

  async signUpWithEmail(params: { email: string; password: string }): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    })

    if (error) {
      throw error
    }
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  },
}

