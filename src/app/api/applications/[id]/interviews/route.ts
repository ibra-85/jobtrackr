import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { interviewsRepository } from "@/db/repositories/interviews.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { CreateInterviewSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { Interview } from "@/db/schema"

/**
 * GET /api/applications/[id]/interviews
 * Récupère tous les entretiens d'une candidature
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

    const interviews = await interviewsRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json({
      data: interviews,
    } as ApiResponse<Interview[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/applications/[id]/interviews
 * Crée un nouvel entretien pour une candidature
 */
export async function POST(
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

    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(CreateInterviewSchema, body)
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

    const interview = await interviewsRepository.create({
      applicationId: id,
      userId: session.user.id,
      title,
      scheduledAt: new Date(scheduledAt),
      duration: duration || undefined,
      location: location || undefined,
      type: type || undefined,
      interviewerName: interviewerName || undefined,
      interviewerEmail: interviewerEmail || undefined,
      notes: notes || undefined,
      status: status || "scheduled",
    })

    // Créer une activité pour l'entretien programmé
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "interview_scheduled",
      description: `Entretien programmé : ${title} le ${new Date(scheduledAt).toLocaleDateString("fr-FR")}`,
      metadata: {
        interviewId: interview.id,
        scheduledAt: scheduledAt,
      },
    })

    return NextResponse.json(
      {
        data: interview,
      } as ApiResponse<Interview>,
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}

