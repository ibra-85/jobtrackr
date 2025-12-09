import { auth } from "@/lib/auth/better-auth"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Routes protégées nécessitant une authentification
 */
const protectedRoutes = ["/dashboard", "/applications", "/documents"]

/**
 * Routes publiques (redirection vers /dashboard si déjà connecté)
 */
const authRoutes = ["/login", "/register"]

/**
 * Routes qui ne nécessitent pas de vérification d'email
 */
const routesWithoutEmailVerification = ["/verify-email", "/forgot-password", "/reset-password"]

/**
 * Mode développement : désactiver la vérification d'email
 * En développement (NODE_ENV=development), la vérification d'email est automatiquement désactivée
 */
const isDevelopment = process.env.NODE_ENV === "development"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorer les routes API et les assets
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  // Vérifier si la route est une route d'auth
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Vérifier si la route nécessite une vérification d'email
  const requiresEmailVerification = !routesWithoutEmailVerification.some((route) =>
    pathname.startsWith(route),
  )

  // Récupérer la session une seule fois pour optimiser
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null
  if (isProtectedRoute || isAuthRoute) {
    try {
      session = await auth.api.getSession({
        headers: request.headers,
      })
    } catch {
      // En cas d'erreur, traiter comme non connecté
      session = null
    }
  }

  // Pour les routes protégées, vérifier la session et l'email vérifié
  if (isProtectedRoute) {
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Vérifier si l'email est vérifié (sauf en mode développement)
    const emailVerified = session.user?.emailVerified ?? false
    
    if (
      !isDevelopment &&
      requiresEmailVerification &&
      session.user &&
      !emailVerified
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/verify-email"
      redirectUrl.searchParams.set("email", session.user.email || "")
      redirectUrl.searchParams.set("callbackURL", pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Rediriger vers /dashboard si déjà connecté et sur une route d'auth
  if (isAuthRoute) {
    if (session?.user) {
      // Si l'email n'est pas vérifié et qu'on n'est pas en développement, rediriger vers la page de vérification
      const emailVerified = session.user.emailVerified ?? false
      if (!isDevelopment && !emailVerified) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/verify-email"
        redirectUrl.searchParams.set("email", session.user.email || "")
        return NextResponse.redirect(redirectUrl)
      }

      // Sinon, rediriger vers le dashboard
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
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

