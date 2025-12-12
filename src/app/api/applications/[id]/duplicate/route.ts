import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import type { ApplicationResponse } from "@/types/api"

/**
 * POST /api/applications/[id]/duplicate
 * Duplique une candidature
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Récupérer la candidature originale
    const originalApplication = await applicationsRepository.getById(id, session.user.id)
    if (!originalApplication) {
      throw new NotFoundError("Candidature")
    }

    // Créer une nouvelle candidature avec les mêmes données (statut remis à "pending")
    const duplicatedApplication = await applicationsRepository.create(session.user.id, {
      title: `${originalApplication.title} (copie)`,
      companyId: originalApplication.companyId,
      status: "pending",
    })

    // Créer une activité pour la duplication
    await activitiesRepository.create(session.user.id, {
      applicationId: duplicatedApplication.id,
      type: "application_created",
      description: `Candidature dupliquée depuis "${originalApplication.title}"`,
      metadata: {
        duplicatedFrom: originalApplication.id,
      },
    })

    // Enrichir avec les informations de l'entreprise
    let company = undefined
    if (duplicatedApplication.companyId) {
      company = await companiesRepository.getById(duplicatedApplication.companyId)
    }

    return NextResponse.json(
      {
        data: { ...duplicatedApplication, company },
      } as ApplicationResponse,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

