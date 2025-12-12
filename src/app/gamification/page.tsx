"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Zap, Flame, Target, Plus } from "lucide-react"
import type { BadgeType } from "@/db/schema"

interface GamificationStats {
  totalPoints: number
  badgesCount: number
  badges: Array<{
    id: string
    badgeType: BadgeType
    earnedAt: string
  }>
  streak: {
    current: number
    longest: number
    lastActivityDate: string | null
  } | null
}

interface Goal {
  id: string
  type: string
  period: string
  target: number
  current: number
  completed: boolean
  createdAt: string
}

const BADGE_INFO: Record<
  BadgeType,
  { name: string; description: string; emoji: string }
> = {
  first_application: {
    name: "Premier pas",
    description: "Créer votre première candidature",
    emoji: "🎯",
  },
  first_interview: {
    name: "Premier entretien",
    description: "Planifier votre premier entretien",
    emoji: "🤝",
  },
  first_acceptance: {
    name: "Première victoire",
    description: "Obtenir votre première acceptation",
    emoji: "🏆",
  },
  applications_10: {
    name: "Déterminé",
    description: "Créer 10 candidatures",
    emoji: "💪",
  },
  applications_50: {
    name: "Persévérant",
    description: "Créer 50 candidatures",
    emoji: "🔥",
  },
  applications_100: {
    name: "Inarrêtable",
    description: "Créer 100 candidatures",
    emoji: "⚡",
  },
  streak_7: {
    name: "Série de 7 jours",
    description: "Maintenir une série de 7 jours consécutifs",
    emoji: "📅",
  },
  streak_30: {
    name: "Série de 30 jours",
    description: "Maintenir une série de 30 jours consécutifs",
    emoji: "📆",
  },
  streak_100: {
    name: "Légende",
    description: "Maintenir une série de 100 jours consécutifs",
    emoji: "👑",
  },
  cv_created: {
    name: "CV créé",
    description: "Créer votre premier CV",
    emoji: "📄",
  },
  letter_created: {
    name: "Lettre créée",
    description: "Créer votre première lettre de motivation",
    emoji: "✉️",
  },
  ai_used: {
    name: "IA utilisée",
    description: "Utiliser l'IA pour la première fois",
    emoji: "🤖",
  },
  profile_complete: {
    name: "Profil complet",
    description: "Compléter votre profil",
    emoji: "✅",
  },
}

export default function GamificationPage() {
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, goalsRes] = await Promise.all([
        fetch("/api/gamification/stats"),
        fetch("/api/gamification/goals"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData.goals || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Gamification</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8" />
            Gamification
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez votre progression et débloquez des récompenses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points totaux</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPoints ?? 0}</div>
              <p className="text-xs text-muted-foreground">Points accumulés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.badgesCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">Badges débloqués</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Série actuelle</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.streak?.current ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Meilleure série: {stats?.streak?.longest ?? 0} jours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges débloqués</CardTitle>
            <CardDescription>Vos récompenses et accomplissements</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.badges && stats.badges.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.badges.map((badge) => {
                  const info = BADGE_INFO[badge.badgeType]
                  return (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                    >
                      <div className="text-3xl">{info.emoji}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{info.name}</h3>
                        <p className="text-sm text-muted-foreground">{info.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Obtenu le {new Date(badge.earnedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun badge débloqué pour le moment. Continuez vos efforts !
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Objectifs</CardTitle>
              <CardDescription>Suivez votre progression vers vos objectifs</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel objectif
            </Button>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = Math.min((goal.current / goal.target) * 100, 100)
                  const periodLabels: Record<string, string> = {
                    daily: "Quotidien",
                    weekly: "Hebdomadaire",
                    monthly: "Mensuel",
                  }
                  const typeLabels: Record<string, string> = {
                    applications_count: "Candidatures",
                    interviews_count: "Entretiens",
                    streak_days: "Série de jours",
                    points_earned: "Points",
                  }

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {typeLabels[goal.type] || goal.type} - {periodLabels[goal.period] || goal.period}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {goal.current} / {goal.target}
                          </p>
                        </div>
                        {goal.completed && (
                          <Badge variant="default" className="bg-green-500">
                            Complété
                          </Badge>
                        )}
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun objectif défini. Créez-en un pour commencer !
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

