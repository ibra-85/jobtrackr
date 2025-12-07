// Point d'entrée d'auth : utilise Better Auth

import type { AuthAdapter } from "./types"
import { betterAuthAdapter } from "./better-auth-adapter"

export const authAdapter: AuthAdapter = betterAuthAdapter



