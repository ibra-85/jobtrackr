import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { remindersRepository } from "@/db/repositories/reminders.repository"
import { UpdateReminderSchema } from "@/lib/validation/schemas"
import { validateRequest } from "@/lib/validation/helpers"
import type { ApiResponse } from "@/types/api"
import type { Reminder } from "@/db/schema"

/**
 * GET /api/reminders/[id]
 * Récupère un rappel par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    const reminder = await remindersRepository.getById(id, session.user.id)
    if (!reminder) {
      throw new NotFoundError("Rappel")
    }

    return NextResponse.json({
      data: reminder,
    } as ApiResponse<Reminder>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/reminders/[id]
 * Met à jour un rappel
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(UpdateReminderSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const updateData: Parameters<typeof remindersRepository.update>[2] = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.description !== undefined)
      updateData.description = validation.data.description || undefined
    if (validation.data.dueDate !== undefined && validation.data.dueDate !== "")
      updateData.dueDate = new Date(validation.data.dueDate)
    if (validation.data.status !== undefined) updateData.status = validation.data.status

    const reminder = await remindersRepository.update(id, session.user.id, updateData)

    return NextResponse.json({
      data: reminder,
    } as ApiResponse<Reminder>)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/reminders/[id]
 * Supprime un rappel
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    await remindersRepository.delete(id, session.user.id)

    return NextResponse.json({
      data: { success: true },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

