/**
 * Repository pour les templates de documents.
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { documentTemplates } from "../drizzle-schema"
import { eq, and, or, desc } from "drizzle-orm"
import type { DocumentTemplate, DocumentType, DocumentFormat } from "../schema"

export const documentTemplatesRepository = {
  /**
   * Récupère tous les templates publics et ceux de l'utilisateur
   */
  async getAll(userId?: string): Promise<DocumentTemplate[]> {
    const results = await db
      .select()
      .from(documentTemplates)
      .where(
        or(
          eq(documentTemplates.isPublic, true),
          userId ? eq(documentTemplates.userId, userId) : undefined
        )
      )
      .orderBy(desc(documentTemplates.createdAt))

    return results.map(mapRowToTemplate)
  },

  /**
   * Récupère les templates par type
   */
  async getByType(type: DocumentType, userId?: string): Promise<DocumentTemplate[]> {
    const results = await db
      .select()
      .from(documentTemplates)
      .where(
        and(
          eq(documentTemplates.type, type),
          or(
            eq(documentTemplates.isPublic, true),
            userId ? eq(documentTemplates.userId, userId) : undefined
          )
        )
      )
      .orderBy(desc(documentTemplates.createdAt))

    return results.map(mapRowToTemplate)
  },

  /**
   * Récupère un template par son ID
   */
  async getById(id: string, userId?: string): Promise<DocumentTemplate | null> {
    const results = await db
      .select()
      .from(documentTemplates)
      .where(
        and(
          eq(documentTemplates.id, id),
          or(
            eq(documentTemplates.isPublic, true),
            userId ? eq(documentTemplates.userId, userId) : undefined
          )
        )
      )
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToTemplate(results[0])
  },

  /**
   * Crée un nouveau template
   */
  async create(
    data: {
      name: string
      description?: string
      type: DocumentType
      format: DocumentFormat
      content: string
      isPublic?: boolean
      userId?: string
      thumbnail?: string
    }
  ): Promise<DocumentTemplate> {
    const [created] = await db
      .insert(documentTemplates)
      .values({
        name: data.name,
        description: data.description,
        type: data.type as "cv" | "cover_letter",
        format: data.format as "markdown" | "plain_text" | "html",
        content: data.content,
        isPublic: data.isPublic ?? true,
        userId: data.userId,
        thumbnail: data.thumbnail,
      })
      .returning()

    return mapRowToTemplate(created)
  },

  /**
   * Met à jour un template (seulement si l'utilisateur en est le créateur)
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name: string
      description: string
      content: string
      isPublic: boolean
      thumbnail: string
    }>
  ): Promise<DocumentTemplate> {
    const updateData: Partial<typeof data> & { updatedAt?: Date } = {
      ...data,
      updatedAt: new Date(),
    }

    const [updated] = await db
      .update(documentTemplates)
      .set(updateData)
      .where(
        and(
          eq(documentTemplates.id, id),
          eq(documentTemplates.userId, userId)
        )
      )
      .returning()

    if (!updated) {
      throw new Error(`Template non trouvé ou accès non autorisé`)
    }

    return mapRowToTemplate(updated)
  },

  /**
   * Supprime un template (seulement si l'utilisateur en est le créateur)
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(documentTemplates)
      .where(
        and(
          eq(documentTemplates.id, id),
          eq(documentTemplates.userId, userId)
        )
      )
  },
}

/**
 * Mappe une ligne de la base de données vers le type DocumentTemplate
 */
function mapRowToTemplate(row: typeof documentTemplates.$inferSelect): DocumentTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as DocumentType,
    format: row.format as DocumentFormat,
    content: row.content,
    isPublic: row.isPublic,
    userId: row.userId,
    thumbnail: row.thumbnail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

