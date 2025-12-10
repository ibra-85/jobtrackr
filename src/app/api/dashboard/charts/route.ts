import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import type { ApplicationStatus } from "@/db/schema"

/**
 * GET /api/dashboard/charts
 * Récupère les données pour les graphiques du dashboard
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
      { name: "pending", label: "En attente", value: statusCounts.pending },
      { name: "in_progress", label: "En cours", value: statusCounts.in_progress },
      { name: "accepted", label: "Acceptée", value: statusCounts.accepted },
      { name: "rejected", label: "Refusée", value: statusCounts.rejected },
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
      evolution: evolutionData,
      statusDistribution,
      monthlyDistribution: monthlyBarData,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des données graphiques:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données graphiques" },
      { status: 500 },
    )
  }
}

