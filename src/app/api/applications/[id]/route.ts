import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import type {
  ApplicationStatus,
  ContractType,
  ApplicationSource,
} from "@/db/schema"

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  accepted: "Acceptée",
  rejected: "Refusée",
}

/**
 * GET /api/applications/[id]
 * Récupère une candidature par son ID
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
    const application = await applicationsRepository.getById(id, session.user.id)

    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    // Enrichir avec les informations de l'entreprise
    let company = undefined
    if (application.companyId) {
      company = await companiesRepository.getById(application.companyId)
    }

    return NextResponse.json({ ...application, company })
  } catch (error) {
    console.error("Erreur lors de la récupération de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de la candidature" },
      { status: 500 },
    )
  }
}

/**
 * PUT /api/applications/[id]
 * Met à jour une candidature
 */
export async function PUT(
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
    const {
      title,
      companyId,
      status,
      notes,
      appliedAt,
      deadline,
      contractType,
      location,
      salaryRange,
      source,
      jobUrl,
    } = body

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    // Validation
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Le titre ne peut pas être vide" },
          { status: 400 },
        )
      }
    }

    // Vérifier que le statut est valide si fourni
    const validStatuses: ApplicationStatus[] = ["pending", "in_progress", "accepted", "rejected"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 },
      )
    }

    // Vérifier que l'entreprise existe si companyId est fourni
    if (companyId) {
      const company = await companiesRepository.getById(companyId)
      if (!company) {
        return NextResponse.json(
          { error: "Entreprise non trouvée" },
          { status: 404 },
        )
      }
    }

    const updateData: {
      title?: string
      companyId?: string
      status?: ApplicationStatus
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
    } = {}

    if (title !== undefined) updateData.title = title.trim()
    if (companyId !== undefined) updateData.companyId = companyId
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (appliedAt !== undefined) updateData.appliedAt = appliedAt ? new Date(appliedAt) : undefined
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : undefined
    if (contractType !== undefined) updateData.contractType = contractType as ContractType | undefined
    if (location !== undefined) updateData.location = location
    if (salaryRange !== undefined) updateData.salaryRange = salaryRange
    if (source !== undefined) updateData.source = source as ApplicationSource | undefined
    if (jobUrl !== undefined) updateData.jobUrl = jobUrl

    const application = await applicationsRepository.update(id, session.user.id, updateData)

    // Créer des activités pour les changements
    if (status !== undefined && existingApplication.status !== status) {
      // Changement de statut
      const newStatus = status as ApplicationStatus
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_status_changed",
        description: `Statut changé de "${statusLabels[existingApplication.status]}" à "${statusLabels[newStatus]}"`,
        metadata: {
          oldStatus: existingApplication.status,
          newStatus: newStatus,
        },
      })
    } else if (title !== undefined && existingApplication.title !== title.trim()) {
      // Modification du titre
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_updated",
        description: `Titre modifié : "${existingApplication.title}" → "${title.trim()}"`,
      })
    } else if (companyId !== undefined && existingApplication.companyId !== companyId) {
      // Changement d'entreprise
      const oldCompany = existingApplication.companyId
        ? await companiesRepository.getById(existingApplication.companyId)
        : null
      const newCompany = companyId ? await companiesRepository.getById(companyId) : null
      
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_updated",
        description: `Entreprise modifiée : "${oldCompany?.name || "Aucune"}" → "${newCompany?.name || "Aucune"}"`,
      })
    } else if (title === undefined && companyId === undefined && status === undefined) {
      // Aucun changement détecté, créer quand même une activité générique
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_updated",
        description: "Candidature modifiée",
      })
    }

    // Enrichir avec les informations de l'entreprise
    let company = undefined
    if (application.companyId) {
      company = await companiesRepository.getById(application.companyId)
    }

    return NextResponse.json({ ...application, company })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de la candidature" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/applications/[id]
 * Supprime une candidature
 */
export async function DELETE(
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
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 },
      )
    }

    // Créer une activité pour la suppression AVANT de supprimer la candidature
    await activitiesRepository.create(session.user.id, {
      applicationId: id, // On garde l'ID même si la candidature sera supprimée
      type: "application_deleted",
      description: `Candidature supprimée : "${existingApplication.title}"`,
      metadata: {
        deletedApplicationTitle: existingApplication.title,
        deletedApplicationStatus: existingApplication.status,
      },
    })

    await applicationsRepository.delete(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression de la candidature" },
      { status: 500 },
    )
  }
}

