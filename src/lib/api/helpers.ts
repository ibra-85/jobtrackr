/**
 * Helpers réutilisables pour les API routes.
 * Centralise la logique d'authentification et de gestion d'erreurs.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { ApiError, UnauthorizedError, NotFoundError } from "./errors"

/**
 * Vérifie que l'utilisateur est authentifié et retourne la session.
 * Lance une UnauthorizedError si non authentifié.
 */
export async function requireAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    throw new UnauthorizedError()
  }

  return session
}

/**
 * Gère les erreurs API de manière centralisée.
 * Retourne une réponse JSON appropriée selon le type d'erreur.
 */
export function handleApiError(error: unknown): NextResponse {
  // Erreur API personnalisée
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  // Erreur Zod (validation)
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      {
        error: "Données invalides",
        details: error.issues,
      },
      { status: 400 }
    )
  }

  // Erreur inconnue
  console.error("Erreur serveur non gérée:", error)
  return NextResponse.json(
    {
      error: "Erreur serveur interne",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  )
}

/**
 * Wrapper pour les handlers API qui gère automatiquement les erreurs.
 * Usage:
 * ```typescript
 * export const GET = apiHandler(async (request) => {
 *   const session = await requireAuth(request)
 *   // ... logique ...
 *   return data
 * })
 * ```
 */
export function apiHandler<T>(
  handler: (request: NextRequest, context?: any) => Promise<T>
) {
  return async (
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> => {
    try {
      const data = await handler(request, context)
      return NextResponse.json({ data })
    } catch (error) {
      return handleApiError(error)
    }
  }
}

