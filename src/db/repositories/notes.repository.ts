/**
 * Repository pour les notes personnelles sur les candidatures.
 */

import { db } from "../index"
import { applicationNotes } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type { ApplicationNote } from "../schema"

export const notesRepository = {
  /**
   * Récupère toutes les notes d'une candidature
   */
  async getByApplicationId(
    applicationId: string,
    userId: string,
  ): Promise<ApplicationNote[]> {
    const results = await db
      .select()
      .from(applicationNotes)
      .where(
        and(
          eq(applicationNotes.applicationId, applicationId),
          eq(applicationNotes.userId, userId),
        ),
      )
      .orderBy(desc(applicationNotes.createdAt))

    return results.map(mapRowToNote)
  },

  /**
   * Récupère une note par son ID
   */
  async getById(id: string, userId: string): Promise<ApplicationNote | null> {
    const results = await db
      .select()
      .from(applicationNotes)
      .where(and(eq(applicationNotes.id, id), eq(applicationNotes.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToNote(results[0])
  },

  /**
   * Crée une nouvelle note
   */
  async create(
    applicationId: string,
    userId: string,
    data: { content: string },
  ): Promise<ApplicationNote> {
    const [created] = await db
      .insert(applicationNotes)
      .values({
        applicationId,
        userId,
        content: data.content.trim(),
      })
      .returning()

    return mapRowToNote(created)
  },

  /**
   * Met à jour une note
   */
  async update(
    id: string,
    userId: string,
    data: { content: string },
  ): Promise<ApplicationNote> {
    const [updated] = await db
      .update(applicationNotes)
      .set({
        content: data.content.trim(),
        updatedAt: new Date(),
      })
      .where(and(eq(applicationNotes.id, id), eq(applicationNotes.userId, userId)))
      .returning()

    if (!updated) {
      throw new Error(`Note non trouvée ou accès non autorisé`)
    }

    return mapRowToNote(updated)
  },

  /**
   * Supprime une note
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(applicationNotes)
      .where(and(eq(applicationNotes.id, id), eq(applicationNotes.userId, userId)))
  },
}

/**
 * Mappe une ligne de la base de données vers le type ApplicationNote
 */
function mapRowToNote(row: typeof applicationNotes.$inferSelect): ApplicationNote {
  return {
    id: row.id,
    applicationId: row.applicationId,
    userId: row.userId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

