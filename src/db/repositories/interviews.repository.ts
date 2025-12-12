/**
 * Repository pour les entretiens.
 */

import { db } from "../index"
import { interviews } from "../drizzle-schema"
import { eq, and, desc, gte, lte, or } from "drizzle-orm"
import type { Interview, InterviewStatus } from "../schema"

function mapRowToInterview(row: typeof interviews.$inferSelect): Interview {
  return {
    id: row.id,
    applicationId: row.applicationId,
    userId: row.userId,
    title: row.title,
    scheduledAt: row.scheduledAt,
    duration: row.duration ?? undefined,
    location: row.location ?? undefined,
    type: (row.type as Interview["type"]) ?? undefined,
    interviewerName: row.interviewerName ?? undefined,
    interviewerEmail: row.interviewerEmail ?? undefined,
    notes: row.notes ?? undefined,
    status: (row.status as InterviewStatus) ?? "scheduled",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export const interviewsRepository = {
  /**
   * Récupère tous les entretiens d'un utilisateur
   */
  async getAllByUserId(userId: string): Promise<Interview[]> {
    const results = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(desc(interviews.scheduledAt))

    return results.map(mapRowToInterview)
  },

  /**
   * Récupère tous les entretiens d'une candidature
   */
  async getByApplicationId(
    applicationId: string,
    userId: string,
  ): Promise<Interview[]> {
    const results = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.applicationId, applicationId),
          eq(interviews.userId, userId),
        ),
      )
      .orderBy(desc(interviews.scheduledAt))

    return results.map(mapRowToInterview)
  },

  /**
   * Récupère les entretiens dans une plage de dates
   */
  async getByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Interview[]> {
    const results = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.userId, userId),
          gte(interviews.scheduledAt, startDate),
          lte(interviews.scheduledAt, endDate),
        ),
      )
      .orderBy(interviews.scheduledAt)

    return results.map(mapRowToInterview)
  },

  /**
   * Récupère les entretiens à venir (non complétés, non annulés)
   */
  async getUpcoming(userId: string): Promise<Interview[]> {
    const now = new Date()
    const results = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.userId, userId),
          gte(interviews.scheduledAt, now),
          or(
            eq(interviews.status, "scheduled"),
            eq(interviews.status, "rescheduled"),
          ),
        ),
      )
      .orderBy(interviews.scheduledAt)

    return results.map(mapRowToInterview)
  },

  /**
   * Récupère un entretien par son ID
   */
  async getById(id: string, userId: string): Promise<Interview | null> {
    const results = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToInterview(results[0])
  },

  /**
   * Crée un nouvel entretien
   */
  async create(data: {
    applicationId: string
    userId: string
    title: string
    scheduledAt: Date
    duration?: string
    location?: string
    type?: string
    interviewerName?: string
    interviewerEmail?: string
    notes?: string
    status?: InterviewStatus
  }): Promise<Interview> {
    const [result] = await db
      .insert(interviews)
      .values({
        applicationId: data.applicationId,
        userId: data.userId,
        title: data.title,
        scheduledAt: data.scheduledAt,
        duration: data.duration ?? null,
        location: data.location ?? null,
        type: data.type ?? null,
        interviewerName: data.interviewerName ?? null,
        interviewerEmail: data.interviewerEmail ?? null,
        notes: data.notes ?? null,
        status: data.status ?? "scheduled",
      })
      .returning()

    return mapRowToInterview(result)
  },

  /**
   * Met à jour un entretien
   */
  async update(
    id: string,
    userId: string,
    data: {
      title?: string
      scheduledAt?: Date
      duration?: string
      location?: string
      type?: string
      interviewerName?: string
      interviewerEmail?: string
      notes?: string
      status?: InterviewStatus
    },
  ): Promise<Interview | null> {
    const [result] = await db
      .update(interviews)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .returning()

    if (!result) {
      return null
    }

    return mapRowToInterview(result)
  },

  /**
   * Supprime un entretien
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, userId)))
      .returning()

    return result.length > 0
  },
}

