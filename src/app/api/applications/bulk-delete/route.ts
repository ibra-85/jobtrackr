import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { validateRequest } from "@/lib/validation/helpers"
import { z } from "zod"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"

const BulkDeleteSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1, "Au moins une candidature est requise"),
})

/**
 * POST /api/applications/bulk-delete
 * Supprime plusieurs candidatures en une fois
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(BulkDeleteSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { applicationIds } = validation.data
    const userId = session.user.id

    // Vérifier que toutes les candidatures existent et appartiennent à l'utilisateur
    const existingApplications = await Promise.all(
      applicationIds.map((id) => applicationsRepository.getById(id, userId))
    )

    // Filtrer les candidatures qui n'existent pas ou n'appartiennent pas à l'utilisateur
    const validApplications = existingApplications.filter(
      (app): app is NonNullable<typeof app> => app !== null
    )

    if (validApplications.length === 0) {
      return NextResponse.json(
        { error: "Aucune candidature valide trouvée" },
        { status: 404 }
      )
    }

    // Créer des activités pour chaque suppression avant de supprimer
    const activityPromises = validApplications.map((app) => {
      const statusLabel = APPLICATION_STATUS_LABELS[app.status]
      return activitiesRepository.create(userId, {
        applicationId: app.id,
        type: "application_deleted",
        description: `Candidature "${app.title}" supprimée (statut: ${statusLabel})`,
        metadata: {
          deletedApplicationTitle: app.title,
          deletedApplicationStatus: app.status,
        },
      })
    })
    await Promise.all(activityPromises)

    // Supprimer chaque candidature
    const deletePromises = validApplications.map((app) =>
      applicationsRepository.delete(app.id, userId)
    )
    await Promise.all(deletePromises)

    return NextResponse.json({
      message: `${validApplications.length} candidature(s) supprimée(s) avec succès`,
      deletedCount: validApplications.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

