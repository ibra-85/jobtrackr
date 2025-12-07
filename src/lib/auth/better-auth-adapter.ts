import { authClient } from "./client"
import type { AuthAdapter, Session } from "./types"
import { getEmailValidationError } from "@/lib/validation/email"

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthError"
  }
}

export const betterAuthAdapter: AuthAdapter = {
  async getSession(): Promise<Session | null> {
    try {
      const { data } = await authClient.getSession()
      if (!data?.session) {
        return null
      }

      const session = data.session
      
      // Better Auth retourne user séparément dans data.user
      // ou on peut utiliser data.user directement si disponible
      if (data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email || "",
            name: data.user.name || undefined,
            emailVerified: data.user.emailVerified ?? false,
          },
          expiresAt: session.expiresAt ? new Date(session.expiresAt) : undefined,
        }
      }

      // Si user n'est pas disponible, on utilise userId de la session
      // mais on ne peut pas récupérer email/name sans un appel supplémentaire
      // Pour l'instant, on retourne null si user n'est pas disponible
      return null
    } catch {
      return null
    }
  },

  async signInWithEmail(params: { email: string; password: string }): Promise<void> {
    const emailError = getEmailValidationError(params.email)
    if (emailError) {
      throw new AuthError(emailError)
    }

    const result = await authClient.signIn.email({
      email: params.email.trim().toLowerCase(),
      password: params.password,
    })

    if (result.error) {
      throw new AuthError(result.error.message || "Erreur lors de la connexion")
    }
  },

  async signUpWithEmail(params: { email: string; password: string }): Promise<void> {
    const emailError = getEmailValidationError(params.email)
    if (emailError) {
      throw new AuthError(emailError)
    }

    if (params.password.length < 6) {
      throw new AuthError("Le mot de passe doit contenir au moins 6 caractères.")
    }

    // Extraire un nom par défaut depuis l'email (partie avant @)
    const emailName = params.email.trim().toLowerCase().split("@")[0]

    const result = await authClient.signUp.email({
      email: params.email.trim().toLowerCase(),
      password: params.password,
      name: emailName, // Better Auth requiert un nom
    })

    if (result.error) {
      throw new AuthError(result.error.message || "Erreur lors de l'inscription")
    }
  },

  async signOut(): Promise<void> {
    const result = await authClient.signOut()
    if (result.error) {
      throw new AuthError(result.error.message || "Erreur lors de la déconnexion")
    }
  },
}

