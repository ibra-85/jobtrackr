import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import type { ApplicationStatus } from "@/db/schema"
import type { ApiResponse } from "@/types/api"

/**
 * GET /api/dashboard/charts
 * Récupère les données pour les graphiques du dashboard
 * TODO: Optimiser avec requêtes SQL agrégées au lieu de charger toutes les données
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // NOTE: Charge toutes les candidatures - à optimiser avec SQL GROUP BY
    const applications = await applicationsRepository.getAllByUserId(session.user.id)

    // Calculer l'évolution par mois (6 derniers mois)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const monthlyData: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyData[monthKey] = 0
    }

    applications.forEach((app) => {
      const appDate = new Date(app.createdAt)
      if (appDate >= sixMonthsAgo) {
        const monthKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, "0")}`
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey]++
        }
      }
    })

    const evolutionData = Object.entries(monthlyData).map(([month, count]) => {
      const [year, monthNum] = month.split("-")
      const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      return {
        month: date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
        count,
      }
    })

    // Répartition par statut
    const statusCounts: Record<ApplicationStatus, number> = {
      pending: 0,
      in_progress: 0,
      accepted: 0,
      rejected: 0,
    }

    applications.forEach((app) => {
      statusCounts[app.status]++
    })

    const statusDistribution = [
      { name: "pending", label: APPLICATION_STATUS_LABELS.pending, value: statusCounts.pending },
      { name: "in_progress", label: APPLICATION_STATUS_LABELS.in_progress, value: statusCounts.in_progress },
      { name: "accepted", label: APPLICATION_STATUS_LABELS.accepted, value: statusCounts.accepted },
      { name: "rejected", label: APPLICATION_STATUS_LABELS.rejected, value: statusCounts.rejected },
    ].filter((item) => item.value > 0)

    // Répartition par mois (candidatures créées)
    const monthlyDistribution: Record<string, number> = {}
    applications.forEach((app) => {
      const appDate = new Date(app.createdAt)
      const monthKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, "0")}`
      monthlyDistribution[monthKey] = (monthlyDistribution[monthKey] || 0) + 1
    })

    const monthlyBarData = Object.entries(monthlyDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // 6 derniers mois
      .map(([month, count]) => {
        const [year, monthNum] = month.split("-")
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        return {
          month: date.toLocaleDateString("fr-FR", { month: "short" }),
          count,
        }
      })

    return NextResponse.json({
      data: {
        evolution: evolutionData,
        statusDistribution,
        monthlyDistribution: monthlyBarData,
      },
    } as ApiResponse<{
      evolution: { month: string; count: number }[]
      statusDistribution: { name: string; label: string; value: number }[]
      monthlyDistribution: { month: string; count: number }[]
    }>)
  } catch (error) {
    return handleApiError(error)
  }
}

