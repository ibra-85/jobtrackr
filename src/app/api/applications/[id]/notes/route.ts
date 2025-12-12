import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { notesRepository } from "@/db/repositories/notes.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { CreateApplicationNoteSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { ApplicationNote } from "@/db/schema"

/**
 * GET /api/applications/[id]/notes
 * Récupère toutes les notes d'une candidature
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

    const notes = await notesRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json({
      data: notes,
    } as ApiResponse<ApplicationNote[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/applications/[id]/notes
 * Crée une nouvelle note pour une candidature
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
    const validation = validateRequest(CreateApplicationNoteSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { content } = validation.data

    const note = await notesRepository.create(id, session.user.id, {
      content,
    })

    // Créer une activité pour l'ajout de note
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "note_added",
      description: `Note ajoutée : "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
    })

    return NextResponse.json(
      {
        data: note,
      } as ApiResponse<ApplicationNote>,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

