/**
 * Repository pour la gamification (badges, points, streaks, objectifs).
 * Utilise Drizzle ORM avec Neon.
 */

import { db } from "../index"
import { userBadges, userPoints, userStreaks, userGoals } from "../drizzle-schema"
import { eq, and, desc, sql, gte, lte } from "drizzle-orm"
import type {
  UserBadge,
  UserPoint,
  UserStreak,
  UserGoal,
  BadgeType,
  GoalType,
  GoalPeriod,
} from "../schema"

export const gamificationRepository = {
  // ========== BADGES ==========

  /**
   * Récupère tous les badges d'un utilisateur
   */
  async getBadgesByUserId(userId: string): Promise<UserBadge[]> {
    const results = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt))

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      badgeType: row.badgeType as BadgeType,
      earnedAt: row.earnedAt,
    }))
  },

  /**
   * Vérifie si un utilisateur a déjà un badge spécifique
   */
  async hasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    const result = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType)))
      .limit(1)

    return result.length > 0
  },

  /**
   * Ajoute un badge à un utilisateur
   */
  async addBadge(userId: string, badgeType: BadgeType): Promise<UserBadge> {
    // Vérifier si le badge existe déjà
    const existing = await this.hasBadge(userId, badgeType)
    if (existing) {
      throw new Error(`L'utilisateur a déjà le badge ${badgeType}`)
    }

    const [result] = await db
      .insert(userBadges)
      .values({
        userId,
        badgeType,
      })
      .returning()

    return {
      id: result.id,
      userId: result.userId,
      badgeType: result.badgeType as BadgeType,
      earnedAt: result.earnedAt,
    }
  },

  // ========== POINTS ==========

  /**
   * Récupère le total de points d'un utilisateur
   */
  async getTotalPointsByUserId(userId: string): Promise<number> {
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${userPoints.points} AS INTEGER)), 0)`,
      })
      .from(userPoints)
      .where(eq(userPoints.userId, userId))

    return result[0]?.total ?? 0
  },

  /**
   * Récupère l'historique des points d'un utilisateur
   */
  async getPointsHistoryByUserId(
    userId: string,
    limit = 50
  ): Promise<UserPoint[]> {
    const results = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .orderBy(desc(userPoints.createdAt))
      .limit(limit)

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      points: parseInt(row.points, 10),
      reason: row.reason,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: row.createdAt,
    }))
  },

  /**
   * Ajoute des points à un utilisateur
   */
  async addPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<UserPoint> {
    const [result] = await db
      .insert(userPoints)
      .values({
        userId,
        points: points.toString(),
        reason,
        metadata: metadata ? (metadata as unknown) : undefined,
      })
      .returning()

    return {
      id: result.id,
      userId: result.userId,
      points: parseInt(result.points, 10),
      reason: result.reason,
      metadata: result.metadata as Record<string, unknown> | undefined,
      createdAt: result.createdAt,
    }
  },

  // ========== STREAKS ==========

  /**
   * Récupère le streak d'un utilisateur
   */
  async getStreakByUserId(userId: string): Promise<UserStreak | null> {
    const [result] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1)

    if (!result) {
      return null
    }

    return {
      id: result.id,
      userId: result.userId,
      currentStreak: parseInt(result.currentStreak, 10),
      longestStreak: parseInt(result.longestStreak, 10),
      lastActivityDate: result.lastActivityDate ?? undefined,
      updatedAt: result.updatedAt,
    }
  },

  /**
   * Crée ou met à jour le streak d'un utilisateur
   */
  async updateStreak(userId: string, activityDate: Date): Promise<UserStreak> {
    const existing = await this.getStreakByUserId(userId)

    if (!existing) {
      // Créer un nouveau streak
      const [result] = await db
        .insert(userStreaks)
        .values({
          userId,
          currentStreak: "1",
          longestStreak: "1",
          lastActivityDate: activityDate,
        })
        .returning()

      return {
        id: result.id,
        userId: result.userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: activityDate,
        updatedAt: result.updatedAt,
      }
    }

    // Vérifier si l'activité est le même jour que la dernière activité
    const lastActivity = existing.lastActivityDate
    if (lastActivity) {
      const lastDate = new Date(lastActivity)
      const currentDate = new Date(activityDate)

      // Réinitialiser à minuit pour comparer les dates
      lastDate.setHours(0, 0, 0, 0)
      currentDate.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff === 0) {
        // Même jour, pas de changement
        return existing
      } else if (daysDiff === 1) {
        // Jour suivant, incrémenter le streak
        const newCurrentStreak = existing.currentStreak + 1
        const newLongestStreak = Math.max(existing.longestStreak, newCurrentStreak)

        const [result] = await db
          .update(userStreaks)
          .set({
            currentStreak: newCurrentStreak.toString(),
            longestStreak: newLongestStreak.toString(),
            lastActivityDate: activityDate,
            updatedAt: new Date(),
          })
          .where(eq(userStreaks.userId, userId))
          .returning()

        return {
          id: result.id,
          userId: result.userId,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: activityDate,
          updatedAt: result.updatedAt,
        }
      } else {
        // Streak cassé, réinitialiser
        const [result] = await db
          .update(userStreaks)
          .set({
            currentStreak: "1",
            lastActivityDate: activityDate,
            updatedAt: new Date(),
          })
          .where(eq(userStreaks.userId, userId))
          .returning()

        return {
          id: result.id,
          userId: result.userId,
          currentStreak: 1,
          longestStreak: existing.longestStreak,
          lastActivityDate: activityDate,
          updatedAt: result.updatedAt,
        }
      }
    } else {
      // Pas de dernière activité, initialiser
      const [result] = await db
        .update(userStreaks)
        .set({
          currentStreak: "1",
          longestStreak: "1",
          lastActivityDate: activityDate,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId))
        .returning()

      return {
        id: result.id,
        userId: result.userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: activityDate,
        updatedAt: result.updatedAt,
      }
    }
  },

  // ========== GOALS ==========

  /**
   * Récupère tous les objectifs d'un utilisateur
   */
  async getGoalsByUserId(userId: string): Promise<UserGoal[]> {
    const results = await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.userId, userId))
      .orderBy(desc(userGoals.createdAt))

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      type: row.type as GoalType,
      period: row.period as GoalPeriod,
      target: parseInt(row.target, 10),
      current: parseInt(row.current, 10),
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      completed: row.completed,
      completedAt: row.completedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  },

  /**
   * Récupère les objectifs actifs d'un utilisateur (non complétés)
   */
  async getActiveGoalsByUserId(userId: string): Promise<UserGoal[]> {
    const results = await db
      .select()
      .from(userGoals)
      .where(and(eq(userGoals.userId, userId), eq(userGoals.completed, false)))
      .orderBy(desc(userGoals.createdAt))

    return results.map((row) => ({
      id: row.id,
      userId: row.userId,
      type: row.type as GoalType,
      period: row.period as GoalPeriod,
      target: parseInt(row.target, 10),
      current: parseInt(row.current, 10),
      startDate: row.startDate,
      endDate: row.endDate ?? undefined,
      completed: row.completed,
      completedAt: row.completedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
  },

  /**
   * Crée un nouvel objectif
   */
  async createGoal(
    userId: string,
    type: GoalType,
    period: GoalPeriod,
    target: number,
    endDate?: Date
  ): Promise<UserGoal> {
    const [result] = await db
      .insert(userGoals)
      .values({
        userId,
        type,
        period,
        target: target.toString(),
        current: "0",
        endDate: endDate ?? undefined,
      })
      .returning()

    return {
      id: result.id,
      userId: result.userId,
      type: result.type as GoalType,
      period: result.period as GoalPeriod,
      target: parseInt(result.target, 10),
      current: 0,
      startDate: result.startDate,
      endDate: result.endDate ?? undefined,
      completed: result.completed,
      completedAt: result.completedAt ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  },

  /**
   * Met à jour la progression d'un objectif
   */
  async updateGoalProgress(
    goalId: string,
    current: number,
    completed?: boolean
  ): Promise<UserGoal> {
    const updateData: {
      current: string
      completed?: boolean
      completedAt?: Date
      updatedAt: Date
    } = {
      current: current.toString(),
      updatedAt: new Date(),
    }

    if (completed !== undefined) {
      updateData.completed = completed
      if (completed) {
        updateData.completedAt = new Date()
      }
    }

    const [result] = await db
      .update(userGoals)
      .set(updateData)
      .where(eq(userGoals.id, goalId))
      .returning()

    return {
      id: result.id,
      userId: result.userId,
      type: result.type as GoalType,
      period: result.period as GoalPeriod,
      target: parseInt(result.target, 10),
      current: parseInt(result.current, 10),
      startDate: result.startDate,
      endDate: result.endDate ?? undefined,
      completed: result.completed,
      completedAt: result.completedAt ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  },

  /**
   * Supprime un objectif
   */
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    await db
      .delete(userGoals)
      .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, userId)))
  },
}

