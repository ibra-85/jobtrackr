import type { Activity, Application } from "@/db/schema"

/**
 * Calcule la dernière interaction avec une candidature
 */
export function getLastInteraction(activities: Activity[]): Activity | null {
  if (activities.length === 0) return null
  
  // Trier par date décroissante et retourner la plus récente
  const sorted = [...activities].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  
  return sorted[0]
}

/**
 * Calcule le nombre de jours depuis la dernière interaction
 */
export function getDaysSinceLastInteraction(activities: Activity[]): number | null {
  const lastInteraction = getLastInteraction(activities)
  if (!lastInteraction) return null
  
  const now = new Date()
  const lastDate = new Date(lastInteraction.createdAt)
  const diffTime = Math.abs(now.getTime() - lastDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Suggère la prochaine action à faire pour une candidature
 */
export function suggestNextAction(
  application: Application,
  activities: Activity[]
): { action: string; urgency: "low" | "medium" | "high" } | null {
  const daysSinceLastInteraction = getDaysSinceLastInteraction(activities)
  const now = new Date()
  
  // Si pas de date de candidature, suggérer de renseigner la date
  if (!application.appliedAt && application.status === "pending") {
    return {
      action: "Renseigner la date de candidature",
      urgency: "low",
    }
  }
  
  // Si deadline approche (dans moins de 3 jours)
  if (application.deadline) {
    const deadlineDate = new Date(application.deadline)
    const daysUntilDeadline = Math.floor(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilDeadline < 0) {
      return {
        action: "La date limite est dépassée",
        urgency: "high",
      }
    }
    
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
      return {
        action: `Date limite dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? "s" : ""}`,
        urgency: "high",
      }
    }
  }
  
  // Si candidature en attente et pas de nouvelle depuis plus de 7 jours
  if (application.status === "pending" && daysSinceLastInteraction !== null) {
    if (daysSinceLastInteraction >= 7) {
      return {
        action: `Relancer (pas de nouvelle depuis ${daysSinceLastInteraction} jour${daysSinceLastInteraction > 1 ? "s" : ""})`,
        urgency: "medium",
      }
    }
  }
  
  // Si candidature en cours et pas de nouvelle depuis plus de 5 jours
  if (application.status === "in_progress" && daysSinceLastInteraction !== null) {
    if (daysSinceLastInteraction >= 5) {
      return {
        action: `Faire un suivi (pas de nouvelle depuis ${daysSinceLastInteraction} jour${daysSinceLastInteraction > 1 ? "s" : ""})`,
        urgency: "medium",
      }
    }
  }
  
  // Si candidature créée mais jamais envoyée (pas de date de candidature)
  if (!application.appliedAt && application.status === "pending") {
    return {
      action: "Envoyer la candidature",
      urgency: "high",
    }
  }
  
  return null
}

/**
 * Formate le nombre de jours en texte lisible
 */
export function formatDaysAgo(days: number): string {
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `Il y a ${months} mois`
  }
  const years = Math.floor(days / 365)
  return `Il y a ${years} an${years > 1 ? "s" : ""}`
}

/**
 * Détermine si une candidature nécessite une action (version simplifiée sans activités)
 * Utilise uniquement les dates de la candidature pour déterminer l'urgence
 */
export function needsAction(application: Application): {
  needsAction: boolean
  urgency: "low" | "medium" | "high" | null
  reason: string | null
} {
  const now = new Date()
  
  // Si candidature créée mais jamais envoyée (pas de date de candidature)
  if (!application.appliedAt && application.status === "pending") {
    return {
      needsAction: true,
      urgency: "high",
      reason: "Candidature non envoyée",
    }
  }
  
  // Si deadline approche ou dépassée
  if (application.deadline) {
    const deadlineDate = new Date(application.deadline)
    const daysUntilDeadline = Math.floor(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntilDeadline < 0) {
      return {
        needsAction: true,
        urgency: "high",
        reason: "Deadline dépassée",
      }
    }
    
    if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
      return {
        needsAction: true,
        urgency: "high",
        reason: `Deadline dans ${daysUntilDeadline} jour${daysUntilDeadline > 1 ? "s" : ""}`,
      }
    }
  }
  
  // Si candidature en attente et pas de nouvelle depuis plus de 7 jours (basé sur updatedAt)
  if (application.status === "pending" && application.updatedAt) {
    const daysSinceUpdate = Math.floor(
      (now.getTime() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceUpdate >= 7) {
      return {
        needsAction: true,
        urgency: "medium",
        reason: `Pas de nouvelle depuis ${daysSinceUpdate} jour${daysSinceUpdate > 1 ? "s" : ""}`,
      }
    }
  }
  
  // Si candidature en cours et pas de nouvelle depuis plus de 5 jours
  if (application.status === "in_progress" && application.updatedAt) {
    const daysSinceUpdate = Math.floor(
      (now.getTime() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceUpdate >= 5) {
      return {
        needsAction: true,
        urgency: "medium",
        reason: `Suivi nécessaire (${daysSinceUpdate} jour${daysSinceUpdate > 1 ? "s" : ""})`,
      }
    }
  }
  
  return {
    needsAction: false,
    urgency: null,
    reason: null,
  }
}

