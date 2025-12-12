import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { remindersRepository } from "@/db/repositories/reminders.repository"
import type { ApiResponse } from "@/types/api"
import type { Reminder } from "@/db/schema"

/**
 * GET /api/reminders
 * Récupère tous les rappels de l'utilisateur
 * Query params optionnels :
 * - status: Filtrer par statut (pending, completed, dismissed)
 * - upcoming: true pour récupérer uniquement les rappels à venir (7 jours)
 * - overdue: true pour récupérer uniquement les rappels échus
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status") as "pending" | "completed" | "dismissed" | null
    const upcoming = searchParams.get("upcoming") === "true"
    const overdue = searchParams.get("overdue") === "true"

    let reminders: Reminder[]

    if (overdue) {
      reminders = await remindersRepository.getOverdueByUserId(session.user.id)
    } else if (upcoming) {
      reminders = await remindersRepository.getUpcomingByUserId(session.user.id, 7)
    } else if (status === "pending") {
      reminders = await remindersRepository.getPendingByUserId(session.user.id)
    } else {
      reminders = await remindersRepository.getAllByUserId(session.user.id)
    }

    return NextResponse.json({
      data: reminders,
    } as ApiResponse<Reminder[]>)
  } catch (error) {
    return handleApiError(error)
  }
}

