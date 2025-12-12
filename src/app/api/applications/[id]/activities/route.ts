import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import type { ActivitiesListResponse } from "@/types/api"

/**
 * GET /api/applications/[id]/activities
 * Récupère les activités liées à une candidature
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      throw new NotFoundError("Candidature")
    }

    // Récupérer les activités liées à cette candidature
    const activities = await activitiesRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json({
      data: activities,
    } as ActivitiesListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

