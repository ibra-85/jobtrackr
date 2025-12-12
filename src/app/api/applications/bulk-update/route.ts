import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { validateRequest } from "@/lib/validation/helpers"
import { z } from "zod"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import type { ApplicationsListResponse } from "@/types/api"
import type { ApplicationStatus } from "@/db/schema"

const BulkUpdateSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1, "Au moins une candidature est requise"),
  status: z.enum(["pending", "in_progress", "accepted", "rejected"]).optional(),
  priority: z.boolean().optional(),
})

/**
 * POST /api/applications/bulk-update
 * Met à jour plusieurs candidatures en une fois
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(BulkUpdateSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { applicationIds, status, priority } = validation.data

    // Vérifier que toutes les candidatures existent et appartiennent à l'utilisateur
    const userId = session.user.id
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

    // Mettre à jour chaque candidature
    const updatePromises = validApplications.map(async (app) => {
      const updateData: { status?: ApplicationStatus; priority?: boolean } = {}
      if (status !== undefined) updateData.status = status
      if (priority !== undefined) updateData.priority = priority

      return applicationsRepository.update(app.id, userId, updateData)
    })

    const updatedApplications = await Promise.all(updatePromises)

    // Créer des activités pour chaque changement de statut
    if (status !== undefined) {
      const statusLabel = APPLICATION_STATUS_LABELS[status]
      const activityPromises = validApplications.map((app) => {
        const oldStatus = app.status
        const oldStatusLabel = APPLICATION_STATUS_LABELS[oldStatus]
        
        // Ne créer une activité que si le statut a changé
        if (oldStatus !== status) {
          return activitiesRepository.create(userId, {
            applicationId: app.id,
            type: "application_status_changed",
            description: `Statut changé de "${oldStatusLabel}" à "${statusLabel}"`,
            metadata: {
              oldStatus,
              newStatus: status,
            },
          })
        }
        return Promise.resolve(null)
      })
      await Promise.all(activityPromises)
    }

    return NextResponse.json({
      data: updatedApplications,
      message: `${updatedApplications.length} candidature(s) mise(s) à jour avec succès`,
    } as ApplicationsListResponse & { message: string })
  } catch (error) {
    return handleApiError(error)
  }
}

