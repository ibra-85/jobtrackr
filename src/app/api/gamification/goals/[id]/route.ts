/**
 * API Route: PUT /api/gamification/goals/[id]
 * Met à jour un objectif
 * DELETE /api/gamification/goals/[id]
 * Supprime un objectif
 */

import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { gamificationRepository } from "@/db/repositories/gamification.repository"
import { validateRequest } from "@/lib/validation/helpers"
import { z } from "zod"

const UpdateGoalSchema = z.object({
  current: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    const body = await request.json()
    const validation = validateRequest(UpdateGoalSchema, body)

    if (!validation.success) {
      return validation.error
    }

    const { current, completed } = validation.data

    // Récupérer l'objectif pour vérifier qu'il appartient à l'utilisateur
    const goals = await gamificationRepository.getGoalsByUserId(session.user.id)
    const goal = goals.find((g) => g.id === id)

    if (!goal) {
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 })
    }

    const updatedGoal = await gamificationRepository.updateGoalProgress(
      id,
      current ?? goal.current,
      completed
    )

    return NextResponse.json({ goal: updatedGoal })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Vérifier que l'objectif appartient à l'utilisateur
    const goals = await gamificationRepository.getGoalsByUserId(session.user.id)
    const goal = goals.find((g) => g.id === id)

    if (!goal) {
      return NextResponse.json({ error: "Objectif non trouvé" }, { status: 404 })
    }

    await gamificationRepository.deleteGoal(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

