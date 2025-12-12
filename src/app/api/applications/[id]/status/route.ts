import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { UpdateApplicationStatusSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import type { ApplicationStatus } from "@/db/schema"
import type { ApplicationResponse } from "@/types/api"

/**
 * PATCH /api/applications/[id]/status
 * Met à jour le statut d'une candidature et crée automatiquement une activité
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateApplicationStatusSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { status } = validation.data

    // Récupérer la candidature existante
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      throw new NotFoundError("Candidature")
    }

    // Si le statut n'a pas changé, ne rien faire
    if (existingApplication.status === status) {
      let company = undefined
      if (existingApplication.companyId) {
        company = await companiesRepository.getById(existingApplication.companyId)
      }
      return NextResponse.json({
        data: { ...existingApplication, company },
      } as ApplicationResponse)
    }

    const oldStatus = existingApplication.status
    const oldStatusLabel = APPLICATION_STATUS_LABELS[oldStatus]
    const newStatusLabel = APPLICATION_STATUS_LABELS[status]

    // Mettre à jour le statut
    const updatedApplication = await applicationsRepository.update(id, session.user.id, {
      status,
    })

    // Créer une activité pour le changement de statut
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "application_status_changed",
      description: `Statut changé de "${oldStatusLabel}" à "${newStatusLabel}"`,
      metadata: {
        oldStatus,
        newStatus: status,
      },
    })

    // Enrichir avec les informations de l'entreprise
    let company = undefined
    if (updatedApplication.companyId) {
      company = await companiesRepository.getById(updatedApplication.companyId)
    }

    return NextResponse.json({
      data: { ...updatedApplication, company },
    } as ApplicationResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

