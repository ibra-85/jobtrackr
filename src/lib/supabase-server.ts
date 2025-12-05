import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Client Supabase côté serveur pour le proxy et les Server Components.
 * Utilise les cookies pour maintenir la session.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Le proxy ne peut pas modifier les cookies dans certains contextes
          }
        },
      },
    },
  )
}

