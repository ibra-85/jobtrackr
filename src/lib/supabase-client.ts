import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // On laisse passer en dev, mais on log pour aider la configuration
  console.warn(
    "[JobTrackr] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant. L'authentification ne fonctionnera pas correctement.",
  )
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? "",
)



