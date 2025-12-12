/**
 * Repository pour les rappels (Reminders).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { reminders } from "../drizzle-schema"
import { eq, and, gte, lte, desc, or } from "drizzle-orm"
import type { Reminder, ReminderType, ReminderStatus } from "../schema"

export const remindersRepository = {
  /**
   * Récupère tous les rappels d'un utilisateur
   */
  async getAllByUserId(userId: string): Promise<Reminder[]> {
    const results = await db
      .select()
      .from(reminders)
      .where(eq(reminders.userId, userId))
      .orderBy(desc(reminders.dueDate))

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère les rappels en attente d'un utilisateur
   */
  async getPendingByUserId(userId: string): Promise<Reminder[]> {
    const results = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.status, "pending")))
      .orderBy(reminders.dueDate)

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère les rappels à venir (dueDate >= aujourd'hui) d'un utilisateur
   */
  async getUpcomingByUserId(userId: string, daysAhead: number = 7): Promise<Reminder[]> {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + daysAhead)

    const results = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.status, "pending"),
          gte(reminders.dueDate, now),
          lte(reminders.dueDate, futureDate)
        )
      )
      .orderBy(reminders.dueDate)

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère les rappels échus (dueDate < aujourd'hui) et en attente
   */
  async getOverdueByUserId(userId: string): Promise<Reminder[]> {
    const now = new Date()

    const results = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.status, "pending"),
          lte(reminders.dueDate, now)
        )
      )
      .orderBy(reminders.dueDate)

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère les rappels associés à une candidature
   */
  async getByApplicationId(applicationId: string, userId: string): Promise<Reminder[]> {
    const results = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.applicationId, applicationId),
          eq(reminders.userId, userId)
        )
      )
      .orderBy(reminders.dueDate)

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère les rappels associés à un entretien
   */
  async getByInterviewId(interviewId: string, userId: string): Promise<Reminder[]> {
    const results = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.interviewId, interviewId),
          eq(reminders.userId, userId)
        )
      )
      .orderBy(reminders.dueDate)

    return results.map(mapRowToReminder)
  },

  /**
   * Récupère un rappel par son ID
   */
  async getById(id: string, userId: string): Promise<Reminder | null> {
    const results = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .limit(1)

    if (results.length === 0) return null
    return mapRowToReminder(results[0])
  },

  /**
   * Crée un rappel
   */
  async create(
    userId: string,
    data: {
      applicationId?: string
      interviewId?: string
      type: ReminderType
      title: string
      description?: string
      dueDate: Date
      isAutomatic?: boolean
    },
  ): Promise<Reminder> {
    const [created] = await db
      .insert(reminders)
      .values({
        userId,
        applicationId: data.applicationId || null,
        interviewId: data.interviewId || null,
        type: data.type as "follow_up" | "deadline" | "interview" | "custom",
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        status: "pending",
        isAutomatic: data.isAutomatic || false,
      })
      .returning()

    return mapRowToReminder(created)
  },

  /**
   * Met à jour un rappel
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string
      description: string
      dueDate: Date
      status: ReminderStatus
    }>,
  ): Promise<Reminder> {
    const updateData: {
      title?: string
      description?: string | null
      dueDate?: Date
      status?: "pending" | "completed" | "dismissed"
      completedAt?: Date | null
      updatedAt?: Date
    } = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.status !== undefined) {
      updateData.status = data.status as "pending" | "completed" | "dismissed"
      if (data.status === "completed") {
        updateData.completedAt = new Date()
      }
    }

    const [updated] = await db
      .update(reminders)
      .set(updateData)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
      .returning()

    if (!updated) {
      throw new Error(`Rappel non trouvé ou accès non autorisé`)
    }

    return mapRowToReminder(updated)
  },

  /**
   * Marque un rappel comme complété
   */
  async markAsCompleted(id: string, userId: string): Promise<Reminder> {
    return this.update(id, userId, {
      status: "completed",
    })
  },

  /**
   * Marque un rappel comme ignoré
   */
  async dismiss(id: string, userId: string): Promise<Reminder> {
    return this.update(id, userId, {
      status: "dismissed",
    })
  },

  /**
   * Supprime un rappel
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, userId)))
  },

  /**
   * Supprime tous les rappels automatiques d'une candidature (pour les regénérer)
   */
  async deleteAutomaticByApplicationId(applicationId: string, userId: string): Promise<void> {
    await db
      .delete(reminders)
      .where(
        and(
          eq(reminders.applicationId, applicationId),
          eq(reminders.userId, userId),
          eq(reminders.isAutomatic, true)
        )
      )
  },
}

/**
 * Mappe une ligne de la base de données vers le type Reminder
 */
function mapRowToReminder(row: typeof reminders.$inferSelect): Reminder {
  return {
    id: row.id,
    userId: row.userId,
    applicationId: row.applicationId || undefined,
    interviewId: row.interviewId || undefined,
    type: row.type as ReminderType,
    title: row.title,
    description: row.description || undefined,
    dueDate: row.dueDate,
    status: row.status as ReminderStatus,
    isAutomatic: row.isAutomatic,
    createdAt: row.createdAt,
    completedAt: row.completedAt || undefined,
  }
}

