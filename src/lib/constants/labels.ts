/**
 * Labels centralisés pour éviter les duplications dans le codebase.
 * Tous les labels d'affichage doivent être définis ici.
 */

import type {
  ApplicationStatus,
  ContractType,
  ApplicationSource,
  CompanySize,
  CompanyType,
  WorkMode,
} from "@/db/schema"

/**
 * Labels pour les statuts de candidature
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  accepted: "Acceptée",
  rejected: "Refusée",
}

/**
 * Labels pour les types de contrat
 */
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  alternance: "Alternance",
  freelance: "Freelance",
  autre: "Autre",
}

/**
 * Labels pour les sources de candidature
 */
export const APPLICATION_SOURCE_LABELS: Record<ApplicationSource, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  welcome_to_the_jungle: "Welcome to the Jungle",
  site_carriere: "Site carrière",
  cooptation: "Cooptation",
  email: "Email",
  autre: "Autre",
}

/**
 * Labels pour les tailles d'entreprise
 */
export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  "1-10": "1-10 employés",
  "11-50": "11-50 employés",
  "51-200": "51-200 employés",
  "201-500": "201-500 employés",
  "501-1000": "501-1000 employés",
  "1000+": "1000+ employés",
}

/**
 * Labels pour les types d'entreprise
 */
export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  startup: "Startup",
  pme: "PME",
  scale_up: "Scale-up",
  grand_groupe: "Grand groupe",
  autre: "Autre",
}

/**
 * Labels pour les modes de travail
 */
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Télétravail",
  hybrid: "Hybride",
  on_site: "Sur site",
}

/**
 * Options pour les selects de statut
 */
export const APPLICATION_STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as ApplicationStatus,
    label,
  })
)

/**
 * Options pour les selects de type de contrat
 */
export const CONTRACT_TYPE_OPTIONS = Object.entries(CONTRACT_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as ContractType,
    label,
  })
)

/**
 * Options pour les selects de source
 */
export const APPLICATION_SOURCE_OPTIONS = Object.entries(APPLICATION_SOURCE_LABELS).map(
  ([value, label]) => ({
    value: value as ApplicationSource,
    label,
  })
)

/**
 * Labels pour les types d'activité
 */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  application_created: "Candidature créée",
  application_updated: "Candidature modifiée",
  application_status_changed: "Statut modifié",
  application_deleted: "Candidature supprimée",
  interview_scheduled: "Entretien programmé",
  note_added: "Note ajoutée",
  contact_added: "Contact ajouté",
  contact_updated: "Contact modifié",
  contact_deleted: "Contact supprimé",
}

