import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import type { StatsResponse } from "@/types/api"

/**
 * GET /api/dashboard/stats
 * Récupère les statistiques du dashboard pour l'utilisateur connecté
 * Optimisé avec COUNT SQL au lieu de charger toutes les données
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Utiliser la méthode optimisée avec COUNT SQL
    const stats = await applicationsRepository.getStatsByUserId(session.user.id)

    return NextResponse.json({
      data: stats,
    } as StatsResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

