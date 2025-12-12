import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import type { ActivitiesListResponse } from "@/types/api"

/**
 * GET /api/dashboard/activities
 * Récupère les activités récentes pour le dashboard avec les informations des candidatures
 * TODO: Optimiser avec JOIN pour éviter N+1 queries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Récupérer les 10 activités les plus récentes
    const activities = await activitiesRepository.getAllByUserId(session.user.id, 10)

    // Enrichir avec les informations des candidatures
    // NOTE: N+1 queries - à optimiser avec JOIN dans le repository
    const activitiesWithApplications = await Promise.all(
      activities.map(async (activity) => {
        let application = null
        let company = null

        if (activity.applicationId) {
          application = await applicationsRepository.getById(
            activity.applicationId,
            session.user.id,
          )
          
          // Si la candidature n'existe plus (supprimée), utiliser les métadonnées
          if (!application && activity.metadata) {
            const deletedTitle = activity.metadata.deletedApplicationTitle as string | undefined
            if (deletedTitle) {
              // Créer un objet application factice pour l'affichage
              application = {
                id: activity.applicationId,
                title: deletedTitle,
                status: (activity.metadata.deletedApplicationStatus as string) || "pending",
                company: null,
              } as any
            }
          } else if (application?.companyId) {
            company = await companiesRepository.getById(application.companyId)
          }
        }

        return {
          ...activity,
          application: application
            ? {
                id: application.id,
                title: application.title,
                status: application.status,
                company: company ? { name: company.name } : null,
              }
            : null,
        }
      }),
    )

    return NextResponse.json({
      data: activitiesWithApplications,
    } as ActivitiesListResponse)
  } catch (error) {
    return handleApiError(error)
  }
}

