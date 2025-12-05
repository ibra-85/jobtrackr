import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Routes protégées nécessitant une authentification
 */
const protectedRoutes = ["/dashboard", "/applications", "/documents"]

/**
 * Routes publiques (redirection vers /dashboard si déjà connecté)
 */
const authRoutes = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  // Vérifier si la route est une route d'auth
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Rediriger vers /login si route protégée et non authentifié
  if (isProtectedRoute && !session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Rediriger vers /dashboard si déjà connecté et sur une route d'auth
  if (isAuthRoute && session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

