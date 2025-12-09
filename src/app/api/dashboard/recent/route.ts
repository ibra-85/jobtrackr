import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"

/**
 * GET /api/dashboard/recent
 * Récupère les candidatures récentes pour le dashboard
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

    // Prendre les 5 plus récentes
    const recentApplications = applications.slice(0, 5)

    // Enrichir avec les informations des entreprises
    const applicationsWithCompanies = await Promise.all(
      recentApplications.map(async (app) => {
        if (app.companyId) {
          const company = await companiesRepository.getById(app.companyId)
          return { ...app, company: company || undefined }
        }
        return { ...app, company: undefined }
      }),
    )

    return NextResponse.json(applicationsWithCompanies)
  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures récentes:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des candidatures récentes" },
      { status: 500 },
    )
  }
}

