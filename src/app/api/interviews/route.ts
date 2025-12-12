import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { interviewsRepository } from "@/db/repositories/interviews.repository"
import type { ApiResponse } from "@/types/api"
import type { Interview } from "@/db/schema"

/**
 * GET /api/interviews
 * Récupère tous les entretiens de l'utilisateur
 * Query params optionnels :
 * - startDate: Date de début (ISO string)
 * - endDate: Date de fin (ISO string)
 * - upcoming: true pour récupérer uniquement les entretiens à venir
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const upcoming = searchParams.get("upcoming") === "true"

    let interviews: Interview[]

    if (upcoming) {
      // Récupérer uniquement les entretiens à venir
      interviews = await interviewsRepository.getUpcoming(session.user.id)
    } else if (startDate && endDate) {
      // Récupérer les entretiens dans une plage de dates
      interviews = await interviewsRepository.getByDateRange(
        session.user.id,
        new Date(startDate),
        new Date(endDate),
      )
    } else {
      // Récupérer tous les entretiens
      interviews = await interviewsRepository.getAllByUserId(session.user.id)
    }

    return NextResponse.json({
      data: interviews,
    } as ApiResponse<Interview[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

