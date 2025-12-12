/**
 * API Route: GET /api/gamification/badges
 * Récupère tous les badges d'un utilisateur
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { gamificationRepository } from "@/db/repositories/gamification.repository"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const badges = await gamificationRepository.getBadgesByUserId(session.user.id)

    return NextResponse.json({ badges })
  } catch (error) {
    return handleApiError(error)
  }
}

