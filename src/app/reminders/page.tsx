"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Reminder } from "@/db/schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const reminderTypeLabels: Record<Reminder["type"], string> = {
  follow_up: "Relance",
  deadline: "Deadline",
  interview: "Entretien",
  custom: "Personnalisé",
}

const reminderStatusLabels: Record<Reminder["status"], string> = {
  pending: "En attente",
  completed: "Complété",
  dismissed: "Ignoré",
}

const reminderTypeColors: Record<Reminder["type"], string> = {
  follow_up: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  deadline: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  interview: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  custom: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "overdue" | "upcoming">("all")

  useEffect(() => {
    fetchReminders()
  }, [filter])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      let url = "/api/reminders"
      if (filter === "pending") {
        url += "?status=pending"
      } else if (filter === "overdue") {
        url += "?overdue=true"
      } else if (filter === "upcoming") {
        url += "?upcoming=true"
      }

      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setReminders(result.data || [])
      } else {
        toast.error("Erreur lors du chargement des rappels")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des rappels")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsCompleted = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })

      if (response.ok) {
        toast.success("Rappel marqué comme complété")
        fetchReminders()
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleDismiss = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      })

      if (response.ok) {
        toast.success("Rappel ignoré")
        fetchReminders()
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const formatDateShort = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date))
  }

  const isOverdue = (reminder: Reminder) => {
    return new Date(reminder.dueDate) < new Date() && reminder.status === "pending"
  }

  const isUpcoming = (reminder: Reminder) => {
    const now = new Date()
    const dueDate = new Date(reminder.dueDate)
    const daysUntil = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 7 && reminder.status === "pending"
  }

  const pendingReminders = reminders.filter((r) => r.status === "pending")
  const overdueReminders = reminders.filter((r) => isOverdue(r))
  const upcomingReminders = reminders.filter((r) => isUpcoming(r))

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Rappels
            </h1>
            <p className="text-muted-foreground mt-1">
              Gère tes rappels et ne manque aucune action importante
            </p>
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rappels</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="overdue">Échus</SelectItem>
              <SelectItem value="upcoming">À venir (7j)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-2xl">{reminders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente
              </CardDescription>
              <CardTitle className="text-2xl">{pendingReminders.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                Échus
              </CardDescription>
              <CardTitle className="text-2xl text-orange-600 dark:text-orange-400">
                {overdueReminders.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
                À venir
              </CardDescription>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                {upcomingReminders.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun rappel</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {filter === "all"
                  ? "Tu n'as aucun rappel pour le moment. Les rappels sont créés automatiquement pour tes candidatures."
                  : `Aucun rappel ${filter === "pending" ? "en attente" : filter === "overdue" ? "échu" : "à venir"}.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const overdue = isOverdue(reminder)
              const upcoming = isUpcoming(reminder)

              return (
                <Card
                  key={reminder.id}
                  className={overdue ? "border-orange-500/50 bg-orange-500/5" : ""}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={reminderTypeColors[reminder.type]}
                          >
                            {reminderTypeLabels[reminder.type]}
                          </Badge>
                          {reminder.isAutomatic && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Automatique
                            </Badge>
                          )}
                          <Badge
                            variant={
                              reminder.status === "completed"
                                ? "default"
                                : reminder.status === "dismissed"
                                  ? "outline"
                                  : "secondary"
                            }
                          >
                            {reminderStatusLabels[reminder.status]}
                          </Badge>
                          {overdue && (
                            <Badge variant="destructive">Échu</Badge>
                          )}
                          {upcoming && !overdue && (
                            <Badge variant="default" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                              À venir
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{reminder.title}</CardTitle>
                        {reminder.description && (
                          <CardDescription className="mt-2">
                            {reminder.description}
                          </CardDescription>
                        )}
                      </div>
                      {reminder.status === "pending" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsCompleted(reminder.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Compléter
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(reminder.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Ignorer
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {overdue
                              ? `Échu le ${formatDateShort(reminder.dueDate)}`
                              : `Échéance : ${formatDate(reminder.dueDate)}`}
                          </span>
                        </div>
                      </div>
                      {reminder.applicationId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/applications/${reminder.applicationId}`}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Voir la candidature
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

