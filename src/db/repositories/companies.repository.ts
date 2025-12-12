/**
 * Repository pour les entreprises (Companies).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { companies } from "../drizzle-schema"
import { eq, ilike, asc } from "drizzle-orm"
import type { Company, CompanySize, CompanyType, WorkMode } from "../schema"

export const companiesRepository = {
  /**
   * Récupère toutes les entreprises
   */
  async getAll(): Promise<Company[]> {
    const results = await db
      .select()
      .from(companies)
      .orderBy(asc(companies.name))

    return results.map(mapRowToCompany)
  },

  /**
   * Récupère une entreprise par son ID
   */
  async getById(id: string): Promise<Company | null> {
    const results = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToCompany(results[0])
  },

  /**
   * Recherche des entreprises par nom
   */
  async searchByName(query: string): Promise<Company[]> {
    const results = await db
      .select()
      .from(companies)
      .where(ilike(companies.name, `%${query}%`))
      .orderBy(asc(companies.name))
      .limit(20)

    return results.map(mapRowToCompany)
  },

  /**
   * Crée une nouvelle entreprise
   */
  async create(data: {
    name: string
    website?: string
    sector?: string
    size?: CompanySize
    type?: CompanyType
    location?: string
    workMode?: WorkMode
  }): Promise<Company> {
    const [created] = await db
      .insert(companies)
      .values({
        name: data.name,
        website: data.website || null,
        sector: data.sector || null,
        size: data.size || null,
        type: data.type || null,
        location: data.location || null,
        workMode: data.workMode || null,
      })
      .returning()

    return mapRowToCompany(created)
  },

  /**
   * Met à jour une entreprise
   */
  async update(
    id: string,
    data: Partial<{
      name: string
      website: string
      sector: string
      size: CompanySize
      type: CompanyType
      location: string
      workMode: WorkMode
    }>,
  ): Promise<Company> {
    const updateData: {
      name?: string
      website?: string | null
      sector?: string | null
      size?: CompanySize | null
      type?: CompanyType | null
      location?: string | null
      workMode?: WorkMode | null
    } = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.website !== undefined) updateData.website = data.website || null
    if (data.sector !== undefined) updateData.sector = data.sector || null
    if (data.size !== undefined) updateData.size = data.size || null
    if (data.type !== undefined) updateData.type = data.type || null
    if (data.location !== undefined) updateData.location = data.location || null
    if (data.workMode !== undefined) updateData.workMode = data.workMode || null

    const [updated] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning()

    if (!updated) {
      throw new Error(`Entreprise non trouvée`)
    }

    return mapRowToCompany(updated)
  },
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

