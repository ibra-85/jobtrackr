import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"

/**
 * POST /api/applications/[id]/duplicate
 * Duplique une candidature
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

    // Récupérer la candidature originale
    const originalApplication = await applicationsRepository.getById(id, session.user.id)
    if (!originalApplication) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
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

    return NextResponse.json({ ...duplicatedApplication, company }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la duplication de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la duplication de la candidature" },
      { status: 500 },
    )
  }
}

