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

/**
 * GET /api/applications
 * Récupère toutes les candidatures de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const applications = await applicationsRepository.getAllByUserId(session.user.id)

    // Enrichir avec les informations des entreprises
    const applicationsWithCompanies = await Promise.all(
      applications.map(async (app) => {
        if (app.companyId) {
          const company = await companiesRepository.getById(app.companyId)
          return { ...app, company: company || undefined }
        }
        return { ...app, company: undefined }
      }),
    )

    return NextResponse.json(applicationsWithCompanies)
  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des candidatures" },
      { status: 500 },
    )
  }
}

/**
 * POST /api/applications
 * Crée une nouvelle candidature
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

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

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 },
      )
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

    const application = await applicationsRepository.create(session.user.id, {
      title: title.trim(),
      companyId,
      status: status || "pending",
      notes: notes || undefined,
      appliedAt: appliedAt ? new Date(appliedAt) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      contractType: contractType as ContractType | undefined,
      location: location || undefined,
      salaryRange: salaryRange || undefined,
      source: source as ApplicationSource | undefined,
      jobUrl: jobUrl || undefined,
    })

    // Créer une activité pour la création
    await activitiesRepository.create(session.user.id, {
      applicationId: application.id,
      type: "application_created",
      description: `Candidature créée : "${title.trim()}"`,
    })

    // Enrichir avec les informations de l'entreprise
    let company = undefined
    if (application.companyId) {
      company = await companiesRepository.getById(application.companyId)
    }

    return NextResponse.json({ ...application, company }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de la candidature:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la candidature" },
      { status: 500 },
    )
  }
}

