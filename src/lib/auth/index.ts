// Point d'entrée d'auth : on choisit ici le provider (Supabase, BetterAuth, etc.)

import type { AuthAdapter } from "./types"
import { supabaseAuthAdapter } from "./supabase-adapter"

// Plus tard, on pourra basculer vers un autre adapter (BetterAuth, etc.)
export const authAdapter: AuthAdapter = supabaseAuthAdapter



