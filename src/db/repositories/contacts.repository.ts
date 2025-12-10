/**
 * Repository pour les contacts associés aux candidatures.
 */

import { db } from "../index"
import { applicationContacts } from "../drizzle-schema"
import { eq, and, desc } from "drizzle-orm"
import type { ApplicationContact } from "../schema"

export const contactsRepository = {
  /**
   * Récupère tous les contacts d'une candidature
   */
  async getByApplicationId(
    applicationId: string,
    userId: string,
  ): Promise<ApplicationContact[]> {
    const results = await db
      .select()
      .from(applicationContacts)
      .where(
        and(
          eq(applicationContacts.applicationId, applicationId),
          eq(applicationContacts.userId, userId),
        ),
      )
      .orderBy(desc(applicationContacts.createdAt))

    return results.map(mapRowToContact)
  },

  /**
   * Récupère un contact par son ID
   */
  async getById(id: string, userId: string): Promise<ApplicationContact | null> {
    const results = await db
      .select()
      .from(applicationContacts)
      .where(
        and(eq(applicationContacts.id, id), eq(applicationContacts.userId, userId)),
      )
      .limit(1)

    if (results.length === 0) {
      return null
    }

    return mapRowToContact(results[0])
  },

  /**
   * Crée un nouveau contact
   */
  async create(
    applicationId: string,
    userId: string,
    data: {
      name: string
      role?: string
      email?: string
      linkedinUrl?: string
      phone?: string
      notes?: string
    },
  ): Promise<ApplicationContact> {
    const [created] = await db
      .insert(applicationContacts)
      .values({
        applicationId,
        userId,
        name: data.name.trim(),
        role: data.role?.trim() || null,
        email: data.email?.trim() || null,
        linkedinUrl: data.linkedinUrl?.trim() || null,
        phone: data.phone?.trim() || null,
        notes: data.notes?.trim() || null,
      })
      .returning()

    return mapRowToContact(created)
  },

  /**
   * Met à jour un contact
   */
  async update(
    id: string,
    userId: string,
    data: {
      name?: string
      role?: string
      email?: string
      linkedinUrl?: string
      phone?: string
      notes?: string
    },
  ): Promise<ApplicationContact> {
    const updateData: {
      name?: string
      role?: string | null
      email?: string | null
      linkedinUrl?: string | null
      phone?: string | null
      notes?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.role !== undefined) updateData.role = data.role?.trim() || null
    if (data.email !== undefined) updateData.email = data.email?.trim() || null
    if (data.linkedinUrl !== undefined)
      updateData.linkedinUrl = data.linkedinUrl?.trim() || null
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null

    const [updated] = await db
      .update(applicationContacts)
      .set(updateData)
      .where(
        and(eq(applicationContacts.id, id), eq(applicationContacts.userId, userId)),
      )
      .returning()

    if (!updated) {
      throw new Error(`Contact non trouvé ou accès non autorisé`)
    }

    return mapRowToContact(updated)
  },

  /**
   * Supprime un contact
   */
  async delete(id: string, userId: string): Promise<void> {
    await db
      .delete(applicationContacts)
      .where(
        and(eq(applicationContacts.id, id), eq(applicationContacts.userId, userId)),
      )
  },
}

/**
 * Mappe une ligne de la base de données vers le type ApplicationContact
 */
function mapRowToContact(
  row: typeof applicationContacts.$inferSelect,
): ApplicationContact {
  return {
    id: row.id,
    applicationId: row.applicationId,
    userId: row.userId,
    name: row.name,
    role: row.role || undefined,
    email: row.email || undefined,
    linkedinUrl: row.linkedinUrl || undefined,
    phone: row.phone || undefined,
    notes: row.notes || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

