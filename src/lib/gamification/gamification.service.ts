/**
 * Service de gamification
 * Gère l'attribution automatique de badges, points et la mise à jour des streaks
 */

import { gamificationRepository } from "@/db/repositories/gamification.repository"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { interviewsRepository } from "@/db/repositories/interviews.repository"
import { documentsRepository } from "@/db/repositories/documents.repository"
import type { BadgeType } from "@/db/schema"

// Points attribués pour chaque action
export const POINTS = {
  APPLICATION_CREATED: 10,
  APPLICATION_UPDATED: 5,
  INTERVIEW_SCHEDULED: 15,
  INTERVIEW_COMPLETED: 20,
  APPLICATION_ACCEPTED: 50,
  DOCUMENT_CREATED: 10,
  AI_USED: 5,
  PROFILE_COMPLETE: 25,
} as const

// Badges et leurs conditions
export const BADGE_CONDITIONS: Record<
  BadgeType,
  {
    name: string
    description: string
    check: (userId: string) => Promise<boolean>
  }
> = {
  first_application: {
    name: "Premier pas",
    description: "Créer votre première candidature",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "first_application")
      if (hasBadge) return false

      const applications = await applicationsRepository.getAllByUserId(userId)
      return applications.length >= 1
    },
  },
  first_interview: {
    name: "Premier entretien",
    description: "Planifier votre premier entretien",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "first_interview")
      if (hasBadge) return false

      const interviews = await interviewsRepository.getAllByUserId(userId)
      return interviews.length >= 1
    },
  },
  first_acceptance: {
    name: "Première victoire",
    description: "Obtenir votre première acceptation",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "first_acceptance")
      if (hasBadge) return false

      const applications = await applicationsRepository.getAllByUserId(userId)
      return applications.some((app) => app.status === "accepted")
    },
  },
  applications_10: {
    name: "Déterminé",
    description: "Créer 10 candidatures",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "applications_10")
      if (hasBadge) return false

      const applications = await applicationsRepository.getAllByUserId(userId)
      return applications.length >= 10
    },
  },
  applications_50: {
    name: "Persévérant",
    description: "Créer 50 candidatures",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "applications_50")
      if (hasBadge) return false

      const applications = await applicationsRepository.getAllByUserId(userId)
      return applications.length >= 50
    },
  },
  applications_100: {
    name: "Inarrêtable",
    description: "Créer 100 candidatures",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "applications_100")
      if (hasBadge) return false

      const applications = await applicationsRepository.getAllByUserId(userId)
      return applications.length >= 100
    },
  },
  streak_7: {
    name: "Série de 7 jours",
    description: "Maintenir une série de 7 jours consécutifs",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "streak_7")
      if (hasBadge) return false

      const streak = await gamificationRepository.getStreakByUserId(userId)
      return streak ? streak.currentStreak >= 7 : false
    },
  },
  streak_30: {
    name: "Série de 30 jours",
    description: "Maintenir une série de 30 jours consécutifs",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "streak_30")
      if (hasBadge) return false

      const streak = await gamificationRepository.getStreakByUserId(userId)
      return streak ? streak.currentStreak >= 30 : false
    },
  },
  streak_100: {
    name: "Légende",
    description: "Maintenir une série de 100 jours consécutifs",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "streak_100")
      if (hasBadge) return false

      const streak = await gamificationRepository.getStreakByUserId(userId)
      return streak ? streak.currentStreak >= 100 : false
    },
  },
  cv_created: {
    name: "CV créé",
    description: "Créer votre premier CV",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "cv_created")
      if (hasBadge) return false

      const documents = await documentsRepository.getAllByUserId(userId)
      return documents.some((doc) => doc.type === "cv")
    },
  },
  letter_created: {
    name: "Lettre créée",
    description: "Créer votre première lettre de motivation",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "letter_created")
      if (hasBadge) return false

      const documents = await documentsRepository.getAllByUserId(userId)
      return documents.some((doc) => doc.type === "cover_letter")
    },
  },
  ai_used: {
    name: "IA utilisée",
    description: "Utiliser l'IA pour la première fois",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "ai_used")
      if (hasBadge) return false

      // Vérifier si l'utilisateur a utilisé l'IA (via les points ou les activités)
      const points = await gamificationRepository.getPointsHistoryByUserId(userId, 100)
      return points.some((p) => p.reason === "ai_used")
    },
  },
  profile_complete: {
    name: "Profil complet",
    description: "Compléter votre profil",
    check: async (userId: string) => {
      const hasBadge = await gamificationRepository.hasBadge(userId, "profile_complete")
      if (hasBadge) return false

      // Vérifier si le profil est complété (via les points)
      const points = await gamificationRepository.getPointsHistoryByUserId(userId, 100)
      return points.some((p) => p.reason === "profile_complete")
    },
  },
}

/**
 * Attribue des points à un utilisateur
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await gamificationRepository.addPoints(userId, points, reason, metadata)
}

/**
 * Met à jour le streak d'un utilisateur
 */
export async function updateStreak(userId: string, activityDate: Date = new Date()): Promise<void> {
  await gamificationRepository.updateStreak(userId, activityDate)
}

/**
 * Vérifie et attribue les badges éligibles pour un utilisateur
 * Retourne la liste des nouveaux badges obtenus
 */
export async function checkAndAwardBadges(userId: string): Promise<BadgeType[]> {
  const newBadges: BadgeType[] = []

  for (const [badgeType, condition] of Object.entries(BADGE_CONDITIONS)) {
    try {
      const eligible = await condition.check(userId)
      if (eligible) {
        const hasBadge = await gamificationRepository.hasBadge(userId, badgeType as BadgeType)
        if (!hasBadge) {
          await gamificationRepository.addBadge(userId, badgeType as BadgeType)
          newBadges.push(badgeType as BadgeType)

          // Attribuer des points pour l'obtention d'un badge
          await awardPoints(userId, 50, "badge_earned", { badgeType })
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du badge ${badgeType}:`, error)
    }
  }

  return newBadges
}

/**
 * Met à jour la progression des objectifs d'un utilisateur
 */
export async function updateGoalsProgress(userId: string): Promise<void> {
  const goals = await gamificationRepository.getActiveGoalsByUserId(userId)
  const now = new Date()

  for (const goal of goals) {
    let current = 0

    // Calculer la progression selon le type d'objectif
    switch (goal.type) {
      case "applications_count": {
        const applications = await applicationsRepository.getAllByUserId(userId)
        // Filtrer selon la période
        const filtered = filterByPeriod(applications, goal.period, goal.startDate, now)
        current = filtered.length
        break
      }
      case "interviews_count": {
        const interviews = await interviewsRepository.getAllByUserId(userId)
        const filtered = filterByPeriod(interviews, goal.period, goal.startDate, now)
        current = filtered.length
        break
      }
      case "streak_days": {
        const streak = await gamificationRepository.getStreakByUserId(userId)
        current = streak ? streak.currentStreak : 0
        break
      }
      case "points_earned": {
        const points = await gamificationRepository.getPointsHistoryByUserId(userId, 1000)
        const filtered = filterByPeriod(points, goal.period, goal.startDate, now)
        current = filtered.reduce((sum, p) => sum + p.points, 0)
        break
      }
    }

    // Mettre à jour l'objectif
    const completed = current >= goal.target
    await gamificationRepository.updateGoalProgress(goal.id, current, completed)

    // Si l'objectif est complété, attribuer des points bonus
    if (completed && !goal.completed) {
      await awardPoints(userId, 100, "goal_completed", { goalId: goal.id, goalType: goal.type })
    }
  }
}

/**
 * Filtre les éléments selon la période
 */
function filterByPeriod<T extends { createdAt: Date }>(
  items: T[],
  period: "daily" | "weekly" | "monthly",
  startDate: Date,
  endDate: Date
): T[] {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  if (period === "daily") {
    // Aujourd'hui uniquement
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return items.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= today && itemDate < tomorrow
    })
  } else if (period === "weekly") {
    // Cette semaine
    const weekStart = new Date(end)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Dimanche
    weekStart.setHours(0, 0, 0, 0)

    return items.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= weekStart && itemDate <= end
    })
  } else {
    // Ce mois
    const monthStart = new Date(end.getFullYear(), end.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)

    return items.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return itemDate >= monthStart && itemDate <= end
    })
  }
}

