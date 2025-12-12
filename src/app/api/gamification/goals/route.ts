/**
 * API Route: GET /api/gamification/goals
 * Récupère tous les objectifs d'un utilisateur
 * POST /api/gamification/goals
 * Crée un nouvel objectif
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { gamificationRepository } from "@/db/repositories/gamification.repository"
import { validateRequest } from "@/lib/validation/helpers"
import { z } from "zod"

const CreateGoalSchema = z.object({
  type: z.enum(["applications_count", "interviews_count", "streak_days", "points_earned"]),
  period: z.enum(["daily", "weekly", "monthly"]),
  target: z.number().int().positive(),
  endDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const goals = await gamificationRepository.getGoalsByUserId(session.user.id)

    return NextResponse.json({ goals })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const body = await request.json()
    const validation = validateRequest(CreateGoalSchema, body)

    if (!validation.success) {
      return validation.error
    }

    const { type, period, target, endDate } = validation.data

    const goal = await gamificationRepository.createGoal(
      session.user.id,
      type,
      period,
      target,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

