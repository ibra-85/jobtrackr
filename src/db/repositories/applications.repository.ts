/**
 * Repository pour les candidatures (Applications).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { applications, companies } from "../drizzle-schema"
import { eq, and, desc, sql } from "drizzle-orm"
import type {
  Application,
  ApplicationStatus,
  ContractType,
  ApplicationSource,
} from "../schema"
import type { Company } from "../schema"
import type { ApplicationWithCompany } from "@/types/api"

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
   * Récupère toutes les candidatures d'un utilisateur avec leurs entreprises (JOIN pour éviter N+1)
   */
  async getAllWithCompaniesByUserId(userId: string): Promise<ApplicationWithCompany[]> {
    const results = await db
      .select({
        application: applications,
        company: companies,
      })
      .from(applications)
      .leftJoin(companies, eq(applications.companyId, companies.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt))

    return results.map((row) => ({
      ...mapRowToApplication(row.application),
      company: row.company ? mapRowToCompany(row.company) : undefined,
    }))
  },

  /**
   * Récupère les statistiques d'un utilisateur (optimisé avec COUNT SQL)
   */
  async getStatsByUserId(userId: string): Promise<{
    total: number
    pending: number
    inProgress: number
    accepted: number
    rejected: number
  }> {
    const results = await db
      .select({
        status: applications.status,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status)

    const stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      accepted: 0,
      rejected: 0,
    }

    results.forEach((row) => {
      const count = Number(row.count)
      stats.total += count
      if (row.status === "pending") stats.pending = count
      else if (row.status === "in_progress") stats.inProgress = count
      else if (row.status === "accepted") stats.accepted = count
      else if (row.status === "rejected") stats.rejected = count
    })

    return stats
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
   * Récupère une candidature par son ID avec son entreprise (JOIN pour éviter N+1)
   */
  async getByIdWithCompany(
    id: string,
    userId: string,
  ): Promise<(Application & { company?: Company }) | null> {
    const results = await db
      .select({
        application: applications,
        company: companies,
      })
      .from(applications)
      .leftJoin(companies, eq(applications.companyId, companies.id))
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    const row = results[0]
    return {
      ...mapRowToApplication(row.application),
      company: row.company ? mapRowToCompany(row.company) : undefined,
    }
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
      priority?: boolean
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      contractTypes?: ContractType[]
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
      importSource?: "url" | "text" | "manual"
    },
  ): Promise<Application> {
    const [created] = await db
      .insert(applications)
      .values({
        userId,
        title: data.title,
        companyId: data.companyId || null,
        status: (data.status || "pending") as "pending" | "in_progress" | "accepted" | "rejected",
        priority: data.priority || false,
        notes: data.notes || null,
        appliedAt: data.appliedAt || null,
        deadline: data.deadline || null,
        contractType: data.contractType || null, // Ancien champ
        contractTypes: data.contractTypes && data.contractTypes.length > 0 ? data.contractTypes : null, // Nouveau champ
        location: data.location || null,
        salaryRange: data.salaryRange || null,
        source: data.source || null,
        jobUrl: data.jobUrl || null,
        importSource: data.importSource || null,
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
      priority?: boolean
      notes?: string
      appliedAt?: Date
      deadline?: Date
      contractType?: ContractType
      contractTypes?: ContractType[]
      location?: string
      salaryRange?: string
      source?: ApplicationSource
      jobUrl?: string
      importSource?: "url" | "text" | "manual"
    }>,
  ): Promise<Application> {
    const updateData: {
      title?: string
      companyId?: string | null
      status?: "pending" | "in_progress" | "accepted" | "rejected"
      priority?: boolean
      notes?: string | null
      appliedAt?: Date | null
      deadline?: Date | null
      contractType?: "cdi" | "cdd" | "stage" | "alternance" | "freelance" | "autre" | null
      contractTypes?: ContractType[] | null
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
      importSource?: "url" | "text" | "manual" | null
      updatedAt?: Date
    } = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.companyId !== undefined) updateData.companyId = data.companyId || null
    if (data.status !== undefined) {
      updateData.status = data.status as "pending" | "in_progress" | "accepted" | "rejected"
    }
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.appliedAt !== undefined) updateData.appliedAt = data.appliedAt || null
    if (data.deadline !== undefined) updateData.deadline = data.deadline || null
    if (data.contractType !== undefined) updateData.contractType = data.contractType || null // Ancien champ
    if (data.contractTypes !== undefined) updateData.contractTypes = data.contractTypes && data.contractTypes.length > 0 ? data.contractTypes : null // Nouveau champ
    if (data.location !== undefined) updateData.location = data.location || null
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange || null
    if (data.source !== undefined) updateData.source = data.source || null
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl || null
    if (data.importSource !== undefined) updateData.importSource = data.importSource || null
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
    priority: row.priority || undefined,
    notes: row.notes || undefined,
    appliedAt: row.appliedAt || undefined,
    deadline: row.deadline || undefined,
    contractType: (row.contractType as ContractType | null) || undefined, // Ancien champ
    contractTypes: row.contractTypes ? (Array.isArray(row.contractTypes) ? row.contractTypes as ContractType[] : JSON.parse(row.contractTypes as string) as ContractType[]) : undefined, // Nouveau champ
    location: row.location || undefined,
    salaryRange: row.salaryRange || undefined,
    source: (row.source as ApplicationSource | null) || undefined,
    jobUrl: row.jobUrl || undefined,
    importSource: (row.importSource as "url" | "text" | "manual" | null) || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/**
 * Mappe une ligne de la base de données vers le type Company
 */
function mapRowToCompany(row: typeof companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    website: row.website || undefined,
    sector: row.sector || undefined,
    size: row.size || undefined,
    type: row.type || undefined,
    location: row.location || undefined,
    workMode: row.workMode || undefined,
    createdAt: row.createdAt,
  }
}

