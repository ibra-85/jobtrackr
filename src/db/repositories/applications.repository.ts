/**
 * Repository pour les candidatures (Applications).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { applications } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type { Application, ApplicationStatus } from "../schema"

export const applicationsRepository = {
  /**
   * Récupère toutes les candidatures d'un utilisateur
   */
  async getAllByUserId(userId: string): Promise<Application[]> {
    const results = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt))

    return results.map(mapRowToApplication)
  },

  /**
   * Récupère une candidature par son ID
   */
  async getById(id: string, userId: string): Promise<Application | null> {
    const results = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToApplication(results[0])
  },

  /**
   * Crée une nouvelle candidature
   */
  async create(
    userId: string,
    data: {
      title: string
      companyId?: string
      status?: ApplicationStatus
    },
  ): Promise<Application> {
    const [created] = await db
      .insert(applications)
      .values({
        userId,
        title: data.title,
        companyId: data.companyId || null,
        status: (data.status || "pending") as "pending" | "in_progress" | "accepted" | "rejected",
      })
      .returning()

    return mapRowToApplication(created)
  },

  /**
   * Met à jour une candidature
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string
      companyId: string
      status: ApplicationStatus
    }>,
  ): Promise<Application> {
    const updateData: {
      title?: string
      companyId?: string | null
      status?: "pending" | "in_progress" | "accepted" | "rejected"
    } = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.companyId !== undefined) updateData.companyId = data.companyId || null
    if (data.status !== undefined) {
      updateData.status = data.status as "pending" | "in_progress" | "accepted" | "rejected"
    }

    const [updated] = await db
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning()

    if (!updated) {
      throw new Error(`Candidature non trouvée ou accès non autorisé`)
    }

    return mapRowToApplication(updated)
  },

  /**
   * Supprime une candidature
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(applications)
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
  },
}

/**
 * Mappe une ligne de la base de données vers le type Application
 */
function mapRowToApplication(row: typeof applications.$inferSelect): Application {
  return {
    id: row.id,
    userId: row.userId,
    companyId: row.companyId || undefined,
    title: row.title,
    status: row.status as ApplicationStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

