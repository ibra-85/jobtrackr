import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { notesRepository } from "@/db/repositories/notes.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"

/**
 * PUT /api/applications/[id]/notes/[noteId]
 * Met à jour une note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { noteId } = await params

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu de la note est requis" },
        { status: 400 },
      )
    }

    const note = await notesRepository.update(noteId, session.user.id, {
      content: content.trim(),
    })

    // Créer une activité pour la modification de note
    await activitiesRepository.create(session.user.id, {
      applicationId: note.applicationId,
      type: "note_added",
      description: `Note modifiée : "${content.trim().substring(0, 50)}${content.trim().length > 50 ? "..." : ""}"`,
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la note:", error)
    if (error instanceof Error && error.message.includes("non trouvée")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de la note" },
      { status: 500 },
    )
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
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { noteId } = await params

    // Récupérer la note avant suppression pour avoir l'applicationId
    const note = await notesRepository.getById(noteId, session.user.id)
    if (!note) {
      return NextResponse.json({ error: "Note non trouvée" }, { status: 404 })
    }

    await notesRepository.delete(noteId, session.user.id)

    // Créer une activité pour la suppression de note
    await activitiesRepository.create(session.user.id, {
      applicationId: note.applicationId,
      type: "note_added",
      description: "Note supprimée",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la note:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression de la note" },
      { status: 500 },
    )
  }
}

