import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { CreateApplicationSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApplicationsListResponse, ApplicationResponse } from "@/types/api"
import { NotFoundError } from "@/lib/api/errors"

/**
 * GET /api/applications
 * Récupère toutes les candidatures de l'utilisateur connecté
 * Optimisé avec JOIN pour éviter N+1 queries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Utiliser la méthode optimisée avec JOIN
    const applications = await applicationsRepository.getAllWithCompaniesByUserId(session.user.id)

    return NextResponse.json({
      data: applications,
    } as ApplicationsListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/applications
 * Crée une nouvelle candidature
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(CreateApplicationSchema, body)
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

    const application = await applicationsRepository.create(session.user.id, {
      title,
      companyId: companyId && companyId !== "" ? companyId : undefined,
      status: status || "pending",
      priority: priority ?? false,
      notes: notes && notes !== "" ? notes : undefined,
      appliedAt: appliedAt && appliedAt !== "" ? new Date(appliedAt) : undefined,
      deadline: deadline && deadline !== "" ? new Date(deadline) : undefined,
      contractType: contractType || undefined, // Ancien champ pour compatibilité
      contractTypes: contractTypes && contractTypes.length > 0 ? contractTypes : undefined, // Nouveau champ
      location: location && location !== "" ? location : undefined,
      salaryRange: salaryRange && salaryRange !== "" ? salaryRange : undefined,
      source: source || undefined,
      jobUrl: jobUrl && jobUrl !== "" ? jobUrl : undefined,
    })

    // Créer une activité pour la création
    await activitiesRepository.create(session.user.id, {
      applicationId: application.id,
      type: "application_created",
      description: `Candidature créée : "${title}"`,
    })

    // Récupérer la candidature créée avec l'entreprise (JOIN optimisé)
    const applicationWithCompany = await applicationsRepository.getByIdWithCompany(
      application.id,
      session.user.id
    )

    return NextResponse.json(
      {
        data: applicationWithCompany!,
      } as ApplicationResponse,
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

