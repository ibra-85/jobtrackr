/**
 * Repository pour les candidatures (Applications).
 * Utilise Supabase pour l'instant, mais peut être migré vers Prisma/Drizzle facilement.
 */

import { supabase } from "@/lib/supabase-client"
import type { Application, ApplicationStatus } from "../schema"

export const applicationsRepository = {
  /**
   * Récupère toutes les candidatures d'un utilisateur
   */
  async getAllByUserId(userId: string): Promise<Application[]> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des candidatures: ${error.message}`)
    }

    return (data || []).map(mapRowToApplication)
  },

  /**
   * Récupère une candidature par son ID
   */
  async getById(id: string, userId: string): Promise<Application | null> {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Not found
      }
      throw new Error(`Erreur lors de la récupération de la candidature: ${error.message}`)
    }

    return data ? mapRowToApplication(data) : null
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
    const { data: created, error } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        title: data.title,
        company_id: data.companyId || null,
        status: data.status || "pending",
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création de la candidature: ${error.message}`)
    }

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
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.companyId !== undefined) updateData.company_id = data.companyId
    if (data.status !== undefined) updateData.status = data.status

    const { data: updated, error } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de la candidature: ${error.message}`)
    }

    return mapRowToApplication(updated)
  },

  /**
   * Supprime une candidature
   */
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      throw new Error(`Erreur lors de la suppression de la candidature: ${error.message}`)
    }
  },
}

/**
 * Mappe une ligne de la base de données vers le type Application
 */
function mapRowToApplication(row: Record<string, unknown>): Application {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    companyId: row.company_id ? String(row.company_id) : undefined,
    title: String(row.title),
    status: row.status as ApplicationStatus,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

