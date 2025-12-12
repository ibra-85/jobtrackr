"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, FileText, Sparkles, TrendingUp, ArrowRight, Activity, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Application, Company, Activity as ActivityType } from "@/db/schema"
import type { ApplicationStatus } from "@/db/schema"
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface ActivityWithApplication extends ActivityType {
  application?: {
    id: string
    title: string
    status: ApplicationStatus
    company?: { name: string } | null
  } | null
}

interface DashboardStats {
  total: number
  pending: number
  inProgress: number
  accepted: number
  rejected: number
}

interface ChartData {
  evolution: { month: string; count: number }[]
  statusDistribution: { name: string; label: string; value: number }[]
  monthlyDistribution: { month: string; count: number }[]
}

// Configuration des couleurs pour les graphiques
const evolutionChartConfig = {
  count: {
    label: "Candidatures",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const statusChartConfig = {
  pending: {
    label: "En attente",
    color: "var(--chart-1)",
  },
  in_progress: {
    label: "En cours",
    color: "var(--chart-2)",
  },
  accepted: {
    label: "Acceptée",
    color: "var(--chart-3)",
  },
  rejected: {
    label: "Refusée",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const monthlyChartConfig = {
  count: {
    label: "Candidatures",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig


const statusColors: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  accepted: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/labels"

const activityBadgeConfig: Record<string, { label: string; className: string }> = {
  application_created: {
    label: "Ajouté",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  application_updated: {
    label: "Modifié",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  application_status_changed: {
    label: "Statut modifié",
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  },
  application_deleted: {
    label: "Supprimé",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  },
  interview_scheduled: {
    label: "Entretien",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  note_added: {
    label: "Note",
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  contact_added: {
    label: "Contact ajouté",
    className: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  },
  contact_updated: {
    label: "Contact modifié",
    className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  },
  contact_deleted: {
    label: "Contact supprimé",
    className: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentApplications, setRecentApplications] = useState<(Application & { company?: Company })[]>([])
  const [activities, setActivities] = useState<ActivityWithApplication[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, recentRes, activitiesRes, chartsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/recent"),
        fetch("/api/dashboard/activities"),
        fetch("/api/dashboard/charts"),
      ])

      if (statsRes.ok) {
        const statsResult = await statsRes.json()
        setStats(statsResult.data)
      }

      if (recentRes.ok) {
        const recentResult = await recentRes.json()
        setRecentApplications(recentResult.data || [])
      }

      if (activitiesRes.ok) {
        const activitiesResult = await activitiesRes.json()
        setActivities(activitiesResult.data || [])
      }

      if (chartsRes.ok) {
        const chartsResult = await chartsRes.json()
        setChartData(chartsResult.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Section */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
          </div>
          <p className="text-muted-foreground text-md leading-relaxed">
            Bienvenue ! Suis tes candidatures, tes documents générés par l&apos;IA
            et toutes les actions liées à ta recherche d&apos;emploi.
          </p>
        </header>

        {/* Quick Actions - Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3" role="list">
          <Card 
            className={cn(
              "group relative overflow-hidden",
              "hover:shadow-xl hover:shadow-primary/5 transition-all duration-300",
              "cursor-pointer",
              "bg-linear-to-br from-card to-card/50",
              "hover:-translate-y-1",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            )}
            role="listitem"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Link 
              href="/applications"
              className="block focus:outline-none relative z-10"
              aria-label="Gérer mes candidatures"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">Candidatures</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-2xl font-bold tracking-tight" aria-label="Nombre de candidatures">
                  {loading ? <Skeleton className="h-7 w-12" /> : stats?.total ?? 0}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Gérer mes candidatures</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card 
            className={cn(
              "group relative overflow-hidden",
              "hover:shadow-xl hover:shadow-primary/5 transition-all duration-300",
              "cursor-pointer",
              "bg-linear-to-br from-card to-card/50",
              "hover:-translate-y-1",
              "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            )}
            role="listitem"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Link 
              href="/documents"
              className="block focus:outline-none relative z-10"
              aria-label="Voir mes documents générés par l'IA"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">CV & Lettres</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="text-2xl font-bold tracking-tight" aria-label="Nombre de documents">
                  —
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Documents générés par l&apos;IA</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card 
            className={cn(
              "group relative overflow-hidden",
              "hover:shadow-xl hover:shadow-primary/5 transition-all duration-300",
              "border-2",
              "bg-linear-to-br from-card to-card/50",
              "hover:-translate-y-1"
            )}
            role="listitem"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-semibold">Statistiques</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 relative z-10">
              <div className="text-2xl font-bold tracking-tight" aria-label="Statistiques">
                {loading ? <Skeleton className="h-7 w-12" /> : (
                  <span className="text-muted-foreground">
                    {stats ? `${stats.accepted}/${stats.total}` : "—"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats ? `${stats.accepted} acceptée${stats.accepted > 1 ? 's' : ''} sur ${stats.total}` : "Vue d'ensemble"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {!loading && chartData && stats && stats.total > 0 && (
          <section className="grid gap-6 grid-cols-1 lg:grid-cols-3" aria-label="Graphiques">
            <Card>
              <CardHeader>
                <CardTitle>Évolution</CardTitle>
                <CardDescription>6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={evolutionChartConfig} className="min-h-[280px] w-full">
                  <LineChart
                    accessibilityLayer
                    data={chartData.evolution}
                    margin={{
                      left: 16,
                      right: 16,
                      top: 16,
                      bottom: 16,
                    }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={35}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="count"
                      type="monotone"
                      stroke="var(--color-count)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--color-count)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Par statut</CardTitle>
                <CardDescription>Distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.statusDistribution.length > 0 ? (
                  <ChartContainer
                    config={statusChartConfig}
                    className="mx-auto min-h-[280px] w-full"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent />}
                      />
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        className="-mt-2"
                      />
                      <Pie
                        data={chartData.statusDistribution.map((item) => ({
                          ...item,
                          fill: `var(--color-${item.name})`,
                        }))}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                        labelLine={false}
                        outerRadius={70}
                        innerRadius={35}
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center min-h-[280px] text-sm text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Par mois</CardTitle>
                <CardDescription>6 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.monthlyDistribution.length > 0 ? (
                  <ChartContainer config={monthlyChartConfig} className="min-h-[280px] w-full">
                    <BarChart
                      accessibilityLayer
                      data={chartData.monthlyDistribution}
                      margin={{
                        left: 16,
                        right: 16,
                        top: 16,
                        bottom: 16,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={8}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={35}
                      />
                      <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center min-h-[280px] text-sm text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Main Content Area */}
        <section className="grid gap-6 lg:grid-cols-2" aria-label="Contenu principal">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Récents</CardTitle>
                    <CardDescription className="mt-1">
                      Tes dernières candidatures et actions
                    </CardDescription>
                  </div>
                </div>
                {!loading && recentApplications.length > 0 && (
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/applications" className="flex items-center gap-2">
                      <span>Voir toutes</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : recentApplications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                    <div className="relative h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Aucune candidature récente
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Commence par ajouter ta première candidature pour voir tes activités ici
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-2 group">
                    <Link href="/applications" className="flex items-center gap-2">
                      <span>Voir toutes les candidatures</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{app.title}</div>
                        {app.company && (
                          <div className="text-sm text-muted-foreground truncate">
                            {app.company.name}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("shrink-0", statusColors[app.status])}
                      >
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Activités</CardTitle>
                  <CardDescription className="mt-1">
                    Historique de tes actions récentes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl" />
                    <div className="relative h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                      <Activity className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Aucune activité récente
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Tes actions et interactions seront affichées ici au fur et à mesure
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-h-[280px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                  {activities.map((activity) => {
                    const badgeConfig = activityBadgeConfig[activity.type] || {
                      label: activity.type,
                      className: "bg-muted text-muted-foreground border-border",
                    }

                    const content = (
                      <div
                        className={cn(
                          "group relative rounded-lg transition-all",
                          activity.application && activity.type !== "application_deleted"
                            ? "hover:border hover:border-border hover:bg-accent/30 cursor-pointer p-3"
                            : "p-3 pb-3 border-b border-border/50 last:border-0",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {activity.application && (
                              <>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-foreground truncate">
                                    {activity.application.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={cn("text-xs font-medium shrink-0", badgeConfig.className)}
                                  >
                                    {badgeConfig.label}
                                  </Badge>
                                </div>
                                {activity.application.company && (
                                  <div className="text-xs text-muted-foreground">
                                    {activity.application.company.name}
                                  </div>
                                )}
                              </>
                            )}
                            {!activity.application && (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs font-medium shrink-0", badgeConfig.className)}
                                >
                                  {badgeConfig.label}
                                </Badge>
                              </div>
                            )}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )

                    // Les activités de suppression ne sont pas cliquables car la candidature n'existe plus
                    if (activity.application && activity.type !== "application_deleted") {
                      return (
                        <Link
                          key={activity.id}
                          href={`/applications/${activity.application.id}`}
                          className="block"
                        >
                          {content}
                        </Link>
                      )
                    }

                    return <div key={activity.id}>{content}</div>
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  )
}



