import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { notesRepository } from "@/db/repositories/notes.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"

/**
 * GET /api/applications/[id]/notes
 * Récupère toutes les notes d'une candidature
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    const notes = await notesRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Erreur lors de la récupération des notes:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des notes" },
      { status: 500 },
    )
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
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const application = await applicationsRepository.getById(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu de la note est requis" },
        { status: 400 },
      )
    }

    const note = await notesRepository.create(id, session.user.id, {
      content: content.trim(),
    })

    // Créer une activité pour l'ajout de note
    await activitiesRepository.create(session.user.id, {
      applicationId: id,
      type: "note_added",
      description: `Note ajoutée : "${content.trim().substring(0, 50)}${content.trim().length > 50 ? "..." : ""}"`,
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de la note:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la note" },
      { status: 500 },
    )
  }
}

