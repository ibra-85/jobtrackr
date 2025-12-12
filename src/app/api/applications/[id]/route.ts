import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { UpdateApplicationSchema, UpdateApplicationStatusSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import type {
  ApplicationStatus,
  ContractType,
  ApplicationSource,
} from "@/db/schema"
import type { ApplicationResponse } from "@/types/api"

/**
 * GET /api/applications/[id]
 * Récupère une candidature par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Utiliser la méthode optimisée avec JOIN pour éviter N+1 queries
    const application = await applicationsRepository.getByIdWithCompany(id, session.user.id)
    if (!application) {
      throw new NotFoundError("Candidature")
    }

    return NextResponse.json({
      data: application,
    } as ApplicationResponse)
  } catch (error) {
    return handleApiError(error)
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
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      throw new NotFoundError("Candidature")
    }

    // Valider les données avec Zod
    const validation = validateRequest(UpdateApplicationSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const {
      title,
      companyId,
      status,
      priority,
      notes,
      appliedAt,
      deadline,
      contractType,
      contractTypes,
      location,
      salaryRange,
      source,
      jobUrl,
    } = validation.data

    // Vérifier que l'entreprise existe si companyId est fourni
    if (companyId && companyId !== "") {
      const company = await companiesRepository.getById(companyId)
      if (!company) {
        throw new NotFoundError("Entreprise")
      }
    }

    const updateData: {
      title?: string
      companyId?: string
      status?: ApplicationStatus
      priority?: boolean
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      contractTypes?: ContractType[]
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
    } = {}

    if (title !== undefined) updateData.title = title
    if (companyId !== undefined) updateData.companyId = companyId && companyId !== "" ? companyId : undefined
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes && notes !== "" ? notes : undefined
    if (appliedAt !== undefined) updateData.appliedAt = appliedAt && appliedAt !== "" ? new Date(appliedAt) : undefined
    if (deadline !== undefined) updateData.deadline = deadline && deadline !== "" ? new Date(deadline) : undefined
    if (contractType !== undefined) updateData.contractType = contractType || undefined // Ancien champ
    if (contractTypes !== undefined) updateData.contractTypes = contractTypes && contractTypes.length > 0 ? contractTypes : undefined // Nouveau champ // Ancien champ
    if (contractTypes !== undefined) updateData.contractTypes = contractTypes && contractTypes.length > 0 ? contractTypes : undefined // Nouveau champ
    if (location !== undefined) updateData.location = location && location !== "" ? location : undefined
    if (salaryRange !== undefined) updateData.salaryRange = salaryRange && salaryRange !== "" ? salaryRange : undefined
    if (source !== undefined) updateData.source = source || undefined
    if (jobUrl !== undefined) updateData.jobUrl = jobUrl && jobUrl !== "" ? jobUrl : undefined

    await applicationsRepository.update(id, session.user.id, updateData)

    // Créer des activités pour les changements
    if (status !== undefined && existingApplication.status !== status) {
      // Changement de statut
      const newStatus = status as ApplicationStatus
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_status_changed",
        description: `Statut changé de "${APPLICATION_STATUS_LABELS[existingApplication.status]}" à "${APPLICATION_STATUS_LABELS[newStatus]}"`,
        metadata: {
          oldStatus: existingApplication.status,
          newStatus: newStatus,
        },
      })
    } else if (title !== undefined && existingApplication.title !== title) {
      // Modification du titre
      await activitiesRepository.create(session.user.id, {
        applicationId: id,
        type: "application_updated",
        description: `Titre modifié : "${existingApplication.title}" → "${title}"`,
      })
    } else if (companyId !== undefined && existingApplication.companyId !== companyId) {
      // Changement d'entreprise (utiliser les données déjà chargées)
      const oldCompany = existingApplication.company || null
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

    // Récupérer la candidature mise à jour avec l'entreprise (JOIN optimisé)
    const applicationWithCompany = await applicationsRepository.getByIdWithCompany(
      id,
      session.user.id
    )

    if (!applicationWithCompany) {
      throw new NotFoundError("Candidature")
    }

    return NextResponse.json({
      data: applicationWithCompany,
    } as ApplicationResponse)
  } catch (error) {
    return handleApiError(error)
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
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que la candidature existe et appartient à l'utilisateur
    const existingApplication = await applicationsRepository.getById(id, session.user.id)
    if (!existingApplication) {
      throw new NotFoundError("Candidature")
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

    return NextResponse.json({
      data: { success: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

