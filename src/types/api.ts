/**
 * Types pour les réponses API.
 * Standardise la structure des réponses pour une meilleure cohérence.
 */

import type { Application, Company, Activity } from "@/db/schema"

/**
 * Réponse API standard avec données optionnelles et métadonnées
 */
export type ApiResponse<T> = {
  data?: T
  error?: string
  code?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

/**
 * Candidature avec entreprise enrichie
 */
export type ApplicationWithCompany = Application & {
  company?: Company
}

/**
 * Réponse pour une liste de candidatures
 */
export type ApplicationsListResponse = ApiResponse<ApplicationWithCompany[]>

/**
 * Réponse pour une candidature unique
 */
export type ApplicationResponse = ApiResponse<ApplicationWithCompany>

/**
 * Réponse pour les statistiques
 */
export type StatsResponse = ApiResponse<{
  total: number
  pending: number
  inProgress: number
  accepted: number
  rejected: number
}>

/**
 * Réponse pour une liste d'activités
 */
export type ActivitiesListResponse = ApiResponse<Activity[]>

/**
 * Réponse pour une liste d'entreprises
 */
export type CompaniesListResponse = ApiResponse<Company[]>

/**
 * Réponse pour une entreprise unique
 */
export type CompanyResponse = ApiResponse<Company>

/**
 * Réponse de succès générique
 */
export type SuccessResponse = ApiResponse<{
  success: boolean
  message?: string
}>

