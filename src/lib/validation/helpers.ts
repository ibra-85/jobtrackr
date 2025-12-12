import { z } from "zod"
import { NextResponse } from "next/server"

/**
 * Helper pour valider les données avec Zod et retourner une réponse d'erreur si invalide
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }))

    return {
      success: false,
      error: NextResponse.json(
        {
          error: "Données invalides",
          details: errors,
        },
        { status: 400 },
      ),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

/**
 * Helper pour formater les erreurs Zod en message lisible
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0]
  if (firstError) {
    const path = firstError.path.length > 0 ? `${firstError.path.join(".")}: ` : ""
    return `${path}${firstError.message}`
  }
  return "Données invalides"
}

