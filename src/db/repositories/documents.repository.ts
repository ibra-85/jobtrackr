/**
 * Repository pour les documents (CV/Lettres).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { documents } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type { Document, DocumentType, DocumentFormat } from "../schema"

export const documentsRepository = {
  /**
   * Récupère tous les documents d'un utilisateur
   */
  async getAllByUserId(userId: string): Promise<Document[]> {
    const results = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.updatedAt))

    return results.map(mapRowToDocument)
  },

  /**
   * Récupère les documents d'un utilisateur par type
   */
  async getByType(userId: string, type: DocumentType): Promise<Document[]> {
    const results = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.type, type)))
      .orderBy(desc(documents.updatedAt))

    return results.map(mapRowToDocument)
  },

  /**
   * Récupère un document par son ID
   */
  async getById(id: string, userId: string): Promise<Document | null> {
    const results = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToDocument(results[0])
  },

  /**
   * Crée un nouveau document
   */
  async create(
    userId: string,
    data: {
      type: DocumentType
      title: string
      content: string
      format?: DocumentFormat
      templateId?: string | null
      metadata?: Record<string, unknown> | null
    },
  ): Promise<Document> {
    const [created] = await db
      .insert(documents)
      .values({
        userId,
        type: data.type as "cv" | "cover_letter",
        title: data.title,
        content: data.content,
        format: (data.format as "markdown" | "plain_text" | "html") || "plain_text",
        templateId: data.templateId,
        metadata: data.metadata,
      })
      .returning()

    return mapRowToDocument(created)
  },

  /**
   * Met à jour un document
   */
  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string
      content: string
      format: DocumentFormat
      metadata: Record<string, unknown> | null
    }>,
  ): Promise<Document> {
    const updateData: Partial<{
      title: string
      content: string
      format: "markdown" | "plain_text" | "html"
      metadata: Record<string, unknown> | null
      updatedAt: Date
    }> = {
      updatedAt: new Date(),
    }
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.format !== undefined) updateData.format = data.format as "markdown" | "plain_text" | "html"
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const [updated] = await db
      .update(documents)
      .set(updateData)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning()

    if (!updated) {
      throw new Error(`Document non trouvé ou accès non autorisé`)
    }

    return mapRowToDocument(updated)
  },

  /**
   * Supprime un document
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
  },
}

/**
 * Mappe une ligne de la base de données vers le type Document
 */
function mapRowToDocument(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as DocumentType,
    title: row.title,
    content: row.content,
    format: (row.format as DocumentFormat) || "plain_text",
    templateId: row.templateId,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

