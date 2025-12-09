import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/better-auth"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import type { ApplicationStatus } from "@/db/schema"

/**
 * GET /api/dashboard/stats
 * Récupère les statistiques du dashboard pour l'utilisateur connecté
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

    // Calculer les statistiques
    const total = applications.length
    const pending = applications.filter((a) => a.status === "pending").length
    const inProgress = applications.filter((a) => a.status === "in_progress").length
    const accepted = applications.filter((a) => a.status === "accepted").length
    const rejected = applications.filter((a) => a.status === "rejected").length

    return NextResponse.json({
      total,
      pending,
      inProgress,
      accepted,
      rejected,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des statistiques" },
      { status: 500 },
    )
  }
}

