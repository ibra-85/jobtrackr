/**
 * Repository pour les candidatures (Applications).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { applications } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type {
  Application,
  ApplicationStatus,
  ContractType,
  ApplicationSource,
} from "../schema"

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
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
    },
  ): Promise<Application> {
    const [created] = await db
      .insert(applications)
      .values({
        userId,
        title: data.title,
        companyId: data.companyId || null,
        status: (data.status || "pending") as "pending" | "in_progress" | "accepted" | "rejected",
        notes: data.notes || null,
        appliedAt: data.appliedAt || null,
        deadline: data.deadline || null,
        contractType: data.contractType || null,
        location: data.location || null,
        salaryRange: data.salaryRange || null,
        source: data.source || null,
        jobUrl: data.jobUrl || null,
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
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
    }>,
  ): Promise<Application> {
    const updateData: {
      title?: string
      companyId?: string | null
      status?: "pending" | "in_progress" | "accepted" | "rejected"
      notes?: string | null
      appliedAt?: Date | null
      deadline?: Date | null
      contractType?: "cdi" | "cdd" | "stage" | "alternance" | "freelance" | "autre" | null
      location?: string | null
      salaryRange?: string | null
      source?:
        | "linkedin"
        | "indeed"
        | "welcome_to_the_jungle"
        | "site_carriere"
        | "cooptation"
        | "email"
        | "autre"
        | null
      jobUrl?: string | null
      updatedAt?: Date
    } = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.companyId !== undefined) updateData.companyId = data.companyId || null
    if (data.status !== undefined) {
      updateData.status = data.status as "pending" | "in_progress" | "accepted" | "rejected"
    }
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt || null
    if (data.deadline !== undefined) updateData.deadline = data.deadline || null
    if (data.contractType !== undefined) updateData.contractType = data.contractType || null
    if (data.location !== undefined) updateData.location = data.location || null
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange || null
    if (data.source !== undefined) updateData.source = data.source || null
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl || null
    updateData.updatedAt = new Date()

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
    notes: row.notes || undefined,
    appliedAt: row.appliedAt || undefined,
    deadline: row.deadline || undefined,
    contractType: (row.contractType as ContractType | null) || undefined,
    location: row.location || undefined,
    salaryRange: row.salaryRange || undefined,
    source: (row.source as ApplicationSource | null) || undefined,
    jobUrl: row.jobUrl || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

