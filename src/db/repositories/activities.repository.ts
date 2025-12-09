/**
 * Repository pour les activités (Activities).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { activities } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type { Activity, ActivityType } from "../schema"

export const activitiesRepository = {
  /**
   * Récupère toutes les activités d'un utilisateur
   */
  async getAllByUserId(userId: string, limit?: number): Promise<Activity[]> {
    let query = db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))

    if (limit) {
      query = query.limit(limit) as typeof query
    }

    const results = await query
    return results.map(mapRowToActivity)
  },

  /**
   * Récupère les activités liées à une candidature
   */
  async getByApplicationId(
    applicationId: string,
    userId: string,
  ): Promise<Activity[]> {
    const results = await db
      .select()
      .from(activities)
      .where(and(eq(activities.applicationId, applicationId), eq(activities.userId, userId)))
      .orderBy(desc(activities.createdAt))

    return results.map(mapRowToActivity)
  },

  /**
   * Crée une nouvelle activité
   */
  async create(
    userId: string,
    data: {
      applicationId?: string
      type: ActivityType
      description: string
      metadata?: Record<string, unknown>
    },
  ): Promise<Activity> {
    const [created] = await db
      .insert(activities)
      .values({
        userId,
        applicationId: data.applicationId || null,
        type: data.type as
          | "application_created"
          | "application_updated"
          | "application_status_changed"
          | "application_deleted"
          | "interview_scheduled"
          | "note_added",
        description: data.description,
        metadata: data.metadata || null,
      })
      .returning()

    return mapRowToActivity(created)
  },

  /**
   * Supprime une activité
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, userId)))
  },
}

/**
 * Mappe une ligne de la base de données vers le type Activity
 */
function mapRowToActivity(row: typeof activities.$inferSelect): Activity {
  return {
    id: row.id,
    userId: row.userId,
    applicationId: row.applicationId || undefined,
    type: row.type as ActivityType,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown> | null) || undefined,
    createdAt: row.createdAt,
  }
}

