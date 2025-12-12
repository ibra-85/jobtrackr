import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { notesRepository } from "@/db/repositories/notes.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { UpdateApplicationNoteSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { ApplicationNote } from "@/db/schema"

/**
 * PUT /api/applications/[id]/notes/[noteId]
 * Met à jour une note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { noteId } = await params

    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateApplicationNoteSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { content } = validation.data

    const note = await notesRepository.update(noteId, session.user.id, {
      content,
    })

    // Créer une activité pour la modification de note
    await activitiesRepository.create(session.user.id, {
      applicationId: note.applicationId,
      type: "note_added",
      description: `Note modifiée : "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`,
    })

    return NextResponse.json({
      data: note,
    } as ApiResponse<ApplicationNote>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/applications/[id]/notes/[noteId]
 * Supprime une note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { noteId } = await params

    // Récupérer la note avant suppression pour avoir l'applicationId
    const note = await notesRepository.getById(noteId, session.user.id)
    if (!note) {
      throw new NotFoundError("Note")
    }

    await notesRepository.delete(noteId, session.user.id)

    // Créer une activité pour la suppression de note
    await activitiesRepository.create(session.user.id, {
      applicationId: note.applicationId,
      type: "note_added",
      description: "Note supprimée",
    })

    return NextResponse.json({
      data: { success: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

