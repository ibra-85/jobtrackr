/**
 * API Route: GET /api/gamification/stats
 * Récupère les statistiques de gamification d'un utilisateur (points totaux, badges, streak)
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { gamificationRepository } from "@/db/repositories/gamification.repository"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Récupérer les statistiques
    const [totalPoints, badges, streak] = await Promise.all([
      gamificationRepository.getTotalPointsByUserId(session.user.id),
      gamificationRepository.getBadgesByUserId(session.user.id),
      gamificationRepository.getStreakByUserId(session.user.id),
    ])

    return NextResponse.json({
      totalPoints,
      badgesCount: badges.length,
      badges,
      streak: streak
        ? {
            current: streak.currentStreak,
            longest: streak.longestStreak,
            lastActivityDate: streak.lastActivityDate,
          }
        : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

