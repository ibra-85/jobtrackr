import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { interviewsRepository } from "@/db/repositories/interviews.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { UpdateInterviewSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { Interview } from "@/db/schema"

/**
 * GET /api/interviews/[id]
 * Récupère un entretien par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    const interview = await interviewsRepository.getById(id, session.user.id)
    if (!interview) {
      throw new NotFoundError("Entretien")
    }

    return NextResponse.json({
      data: interview,
    } as ApiResponse<Interview>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/interviews/[id]
 * Met à jour un entretien
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que l'entretien existe
    const existingInterview = await interviewsRepository.getById(id, session.user.id)
    if (!existingInterview) {
      throw new NotFoundError("Entretien")
    }

    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateInterviewSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const {
      title,
      scheduledAt,
      duration,
      location,
      type,
      interviewerName,
      interviewerEmail,
      notes,
      status,
    } = validation.data

    const updateData: Parameters<typeof interviewsRepository.update>[2] = {}
    if (title !== undefined) updateData.title = title
    if (scheduledAt !== undefined && scheduledAt !== "")
      updateData.scheduledAt = new Date(scheduledAt)
    if (duration !== undefined) updateData.duration = duration || undefined
    if (location !== undefined) updateData.location = location || undefined
    if (type !== undefined) updateData.type = type || undefined
    if (interviewerName !== undefined) updateData.interviewerName = interviewerName || undefined
    if (interviewerEmail !== undefined) updateData.interviewerEmail = interviewerEmail || undefined
    if (notes !== undefined) updateData.notes = notes || undefined
    if (status !== undefined) updateData.status = status

    const interview = await interviewsRepository.update(id, session.user.id, updateData)
    if (!interview) {
      throw new NotFoundError("Entretien")
    }

    // Créer une activité pour la mise à jour
    if (existingInterview.applicationId) {
      await activitiesRepository.create(session.user.id, {
        applicationId: existingInterview.applicationId,
        type: "application_updated",
        description: `Entretien mis à jour : ${interview.title}`,
        metadata: {
          interviewId: interview.id,
          changes: Object.keys(updateData),
        },
      })
    }

    return NextResponse.json({
      data: interview,
    } as ApiResponse<Interview>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/interviews/[id]
 * Supprime un entretien
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que l'entretien existe
    const existingInterview = await interviewsRepository.getById(id, session.user.id)
    if (!existingInterview) {
      throw new NotFoundError("Entretien")
    }

    const deleted = await interviewsRepository.delete(id, session.user.id)
    if (!deleted) {
      throw new NotFoundError("Entretien")
    }

    // Créer une activité pour la suppression
    if (existingInterview.applicationId) {
      await activitiesRepository.create(session.user.id, {
        applicationId: existingInterview.applicationId,
        type: "application_updated",
        description: `Entretien supprimé : ${existingInterview.title}`,
      })
    }

    return NextResponse.json({
      message: "Entretien supprimé avec succès",
    } as ApiResponse<null>)
  } catch (error) {
    return handleApiError(error)
  }
}

