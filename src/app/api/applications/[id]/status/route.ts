import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import type { ApplicationStatus } from "@/db/schema"

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  accepted: "Acceptée",
  rejected: "Refusée",
}

/**
 * PATCH /api/applications/[id]/status
 * Met à jour le statut d'une candidature et crée automatiquement une activité
 */
export async function PATCH(
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
    const body = await request.json()
    const { status } = body

    // Vérifier que le statut est valide
    const validStatuses: ApplicationStatus[] = ["pending", "in_progress", "accepted", "rejected"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 },
      )
    }

    // Récupérer la candidature existante
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    // Si le statut n'a pas changé, ne rien faire
    if (existingApplication.status === status) {
      const company = existingApplication.companyId
        ? await companiesRepository.getById(existingApplication.companyId)
        : undefined
      return NextResponse.json({ ...existingApplication, company })
    }

    const oldStatus = existingApplication.status
    const oldStatusLabel = statusLabels[oldStatus]
    const newStatusLabel = statusLabels[status]

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

    return NextResponse.json({ ...updatedApplication, company })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du statut" },
      { status: 500 },
    )
  }
}

