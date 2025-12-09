import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"

/**
 * GET /api/applications/[id]/activities
 * Récupère les activités liées à une candidature
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

    // Récupérer les activités liées à cette candidature
    const activities = await activitiesRepository.getByApplicationId(id, session.user.id)

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Erreur lors de la récupération des activités:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des activités" },
      { status: 500 },
    )
  }
}

