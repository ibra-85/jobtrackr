// Types et interface d'auth génériques, indépendants du provider

export type Session = {
  user: {
    id: string
    email: string
    name?: string
    emailVerified?: boolean
  }
  expiresAt?: Date
}

export interface AuthAdapter {
  getSession(): Promise<Session | null>
  signInWithEmail(params: { email: string; password: string }): Promise<void>
  signUpWithEmail(params: { email: string; password: string }): Promise<void>
  signOut(): Promise<void>
}


