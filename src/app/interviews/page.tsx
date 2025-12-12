"use client"

import { useState, useEffect, useMemo } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  List,
  X,
  MoreVertical,
} from "lucide-react"
import { toast } from "sonner"
import type { Interview } from "@/db/schema"
import { InterviewDialog } from "@/components/applications/interview-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7

  const days: Date[] = []

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate()
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(prevYear, prevMonth, prevMonthLastDay - i))
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  const totalCells = 42
  const remainingDays = totalCells - days.length
  
  for (let day = 1; day <= remainingDays; day++) {
    days.push(new Date(year, month + 1, day))
  }

  return days
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {DAYS_OF_WEEK.map((day) => (
        <div key={day} className="text-center font-medium text-xs text-muted-foreground p-1">
          {day}
        </div>
      ))}
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="min-h-[60px] border rounded bg-muted/30 animate-pulse" />
      ))}
    </div>
  )
}

export default function InterviewsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null) // Date string as key
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = useMemo(() => getDaysInMonth(year, month), [year, month])

  useEffect(() => {
    fetchInterviews()
  }, [currentDate])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0, 23, 59, 59)

      const response = await fetch(
        `/api/interviews?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      )
      if (response.ok) {
        const result = await response.json()
        setInterviews(result.data || [])
      } else {
        toast.error("Erreur lors du chargement des entretiens")
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des entretiens")
    } finally {
      setLoading(false)
    }
  }

  const getAllInterviews = async () => {
    try {
      const response = await fetch("/api/interviews")
      if (response.ok) {
        const result = await response.json()
        setInterviews(result.data || [])
      }
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  useEffect(() => {
    if (view === "list") {
      getAllInterviews()
    }
  }, [view])

  const getInterviewsForDate = (date: Date): Interview[] => {
    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.scheduledAt)
      return isSameDay(interviewDate, date)
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date, interviewsForDate: Interview[]) => {
    // Si plusieurs entretiens, ouvrir le popover
    if (interviewsForDate.length > 2) {
      const dateKey = date.toISOString()
      setPopoverOpen(popoverOpen === dateKey ? null : dateKey)
      return
    }
    
    // Si un seul entretien, ouvrir directement le dialog d'édition
    if (interviewsForDate.length === 1) {
      setSelectedInterview(interviewsForDate[0])
      setSelectedDate(new Date(interviewsForDate[0].scheduledAt))
      setDialogOpen(true)
      return
    }
    
    // Sinon, créer un nouvel entretien
    setSelectedDate(date)
    setSelectedInterview(null)
    setDialogOpen(true)
  }

  const handleInterviewClick = (interview: Interview, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedInterview(interview)
    setSelectedDate(new Date(interview.scheduledAt))
    setDialogOpen(true)
  }

  const handleEdit = (interview: Interview, e: React.MouseEvent) => {
    e.stopPropagation()
    handleInterviewClick(interview)
  }

  const handleDelete = (interviewId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setInterviewToDelete(interviewId)
    setConfirmDialogOpen(true)
  }

  const handleDeleteFromPopover = (interviewId: string) => {
    setInterviewToDelete(interviewId)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!interviewToDelete) return

    try {
      const response = await fetch(`/api/interviews/${interviewToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Entretien supprimé avec succès")
        if (view === "calendar") {
          fetchInterviews()
        } else {
          getAllInterviews()
        }
        // Fermer le popover si ouvert
        setPopoverOpen(null)
      } else {
        toast.error("Erreur lors de la suppression de l'entretien")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'entretien")
    } finally {
      setInterviewToDelete(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedInterview(null)
    setSelectedDate(null)
    if (view === "calendar") {
      fetchInterviews()
    } else {
      getAllInterviews()
    }
  }

  const sortedInterviews = useMemo(() => {
    return [...interviews].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  }, [interviews])

  return (
    <AppShell>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entretiens</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos entretiens et suivez vos rendez-vous
            </p>
          </div>
          <Button onClick={() => handleDateClick(new Date(), [])}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel entretien
          </Button>
        </div>

        {/* Card avec Tabs */}
        <Card>
          <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle>Gestion des entretiens</CardTitle>
                  <CardDescription>
                    Visualisez et gérez vos entretiens en vue calendrier ou liste
                  </CardDescription>
                </div>
                <TabsList>
                  <TabsTrigger value="calendar">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Calendrier
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="mr-2 h-4 w-4" />
                    Liste
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>

              {/* Vue Calendrier */}
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {MONTHS[month]} {year}
                      </div>
                    </div>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Aujourd'hui
                  </Button>
                </div>

                {loading ? (
                  <CalendarSkeleton />
                ) : (
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day}
                        className="text-center font-medium text-xs text-muted-foreground p-1"
                      >
                        {day}
                      </div>
                    ))}

                    {days.map((date, index) => {
                      const dateInterviews = getInterviewsForDate(date)
                      const isCurrentMonth = date.getMonth() === month
                      const isTodayDate = isToday(date)
                      const hasInterviews = dateInterviews.length > 0
                      const dateKey = date.toISOString()
                      const isPopoverOpen = popoverOpen === dateKey
                      const hasMultipleInterviews = dateInterviews.length > 2

                      return (
                        <Popover
                          key={index}
                          open={isPopoverOpen}
                          onOpenChange={(open) => setPopoverOpen(open ? dateKey : null)}
                        >
                          <PopoverTrigger asChild>
                            <div
                              className={cn(
                                "min-h-[80px] border rounded-lg p-2 cursor-pointer transition-all relative group",
                                isCurrentMonth
                                  ? isTodayDate
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "bg-background hover:bg-muted/50 hover:shadow-sm border-border"
                                  : "bg-muted/30 opacity-50",
                                hasInterviews && "ring-1 ring-primary/20",
                                isPopoverOpen && "ring-2 ring-primary shadow-md"
                              )}
                              onClick={() => {
                                if (!hasMultipleInterviews) {
                                  handleDateClick(date, dateInterviews)
                                }
                              }}
                            >
                              {hasInterviews && (
                                <Badge
                                  variant="default"
                                  className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold shadow-sm"
                                >
                                  {dateInterviews.length}
                                </Badge>
                              )}

                              <div
                                className={cn(
                                  "text-xs font-medium mb-1",
                                  isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                                  isTodayDate && "font-bold text-primary"
                                )}
                              >
                                {date.getDate()}
                              </div>

                              <div className="space-y-0.5">
                                {dateInterviews.slice(0, 2).map((interview) => (
                                  <div
                                    key={interview.id}
                                    className="text-[10px] truncate px-1.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleInterviewClick(interview, e)
                                    }}
                                  >
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" />
                                      {format(new Date(interview.scheduledAt), "HH:mm", { locale: fr })}
                                    </div>
                                    <div className="truncate mt-0.5">{interview.title}</div>
                                  </div>
                                ))}
                                {hasMultipleInterviews && (
                                  <div className="text-[10px] text-muted-foreground mt-1 px-1.5 flex items-center gap-1">
                                    <MoreVertical className="h-3 w-3" />
                                    {dateInterviews.length - 2} autre(s)
                                  </div>
                                )}
                              </div>
                            </div>
                          </PopoverTrigger>
                          {hasMultipleInterviews && (
                            <PopoverContent
                              className="w-80 p-0 flex flex-col"
                              align="start"
                              side="bottom"
                              sideOffset={5}
                              collisionPadding={16}
                              style={{
                                maxHeight: 'min(400px, calc(100vh - 10rem))',
                                overflow: 'hidden',
                              }}
                            >
                              <div className="p-3 border-b shrink-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {dateInterviews.length} entretien{dateInterviews.length > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setPopoverOpen(null)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div 
                                className="overflow-y-auto flex-1 min-h-0 scrollbar-thin"
                                style={{ 
                                  maxHeight: 'min(320px, calc(100vh - 14rem))',
                                  overflowY: 'auto',
                                  overflowX: 'hidden',
                                }}
                              >
                                <div className="divide-y">
                                  {dateInterviews
                                    .sort(
                                      (a, b) =>
                                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                                    )
                                    .map((interview) => {
                                      const interviewDate = new Date(interview.scheduledAt)
                                      const isPast = interviewDate < new Date()

                                      return (
                                        <div
                                          key={interview.id}
                                          className={cn(
                                            "p-3 hover:bg-muted/50 transition-colors",
                                            isPast && "opacity-75"
                                          )}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 mb-1">
                                                <h5 className="font-semibold text-sm truncate">{interview.title}</h5>
                                                <Badge
                                                  variant={
                                                    interview.status === "completed"
                                                      ? "default"
                                                      : interview.status === "cancelled"
                                                        ? "destructive"
                                                        : "secondary"
                                                  }
                                                  className="text-[10px] shrink-0"
                                                >
                                                  {interview.status === "scheduled" && "Programmé"}
                                                  {interview.status === "completed" && "Terminé"}
                                                  {interview.status === "cancelled" && "Annulé"}
                                                  {interview.status === "rescheduled" && "Reporté"}
                                                </Badge>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  {format(interviewDate, "HH:mm", { locale: fr })}
                                                </div>
                                                {interview.location && (
                                                  <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate max-w-[120px]">{interview.location}</span>
                                                  </div>
                                                )}
                                                {interview.type && (
                                                  <Badge variant="outline" className="text-[10px]">
                                                    {interview.type}
                                                  </Badge>
                                                )}
                                              </div>
                                              {interview.interviewerName && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                  <User className="h-3 w-3" />
                                                  {interview.interviewerName}
                                                </div>
                                              )}
                                              {interview.applicationId && (
                                                <Link
                                                  href={`/applications/${interview.applicationId}`}
                                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Voir la candidature →
                                                </Link>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setPopoverOpen(null)
                                                  setSelectedInterview(interview)
                                                  setSelectedDate(new Date(interview.scheduledAt))
                                                  setDialogOpen(true)
                                                }}
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleDeleteFromPopover(interview.id)
                                                }}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                              <div className="p-3 border-t shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setPopoverOpen(null)
                                    setSelectedDate(date)
                                    setSelectedInterview(null)
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Plus className="mr-2 h-3.5 w-3.5" />
                                  Ajouter un entretien
                                </Button>
                              </div>
                            </PopoverContent>
                          )}
                        </Popover>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Vue Liste */}
              <TabsContent value="list" className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : sortedInterviews.length === 0 ? (
                  <EmptyState
                    icons={[CalendarIcon]}
                    title="Aucun entretien"
                    description="Vous n'avez pas encore d'entretien programmé."
                    action={{
                      label: "Créer un entretien",
                      onClick: () => handleDateClick(new Date(), []),
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {sortedInterviews.map((interview) => {
                      const interviewDate = new Date(interview.scheduledAt)
                      const isPast = interviewDate < new Date()

                      return (
                        <div
                          key={interview.id}
                          className={cn(
                            "border rounded-lg p-4 hover:bg-muted/50 transition-colors",
                            isPast && "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{interview.title}</h3>
                                <Badge variant={interview.status === "completed" ? "default" : "secondary"}>
                                  {interview.status === "scheduled" && "Programmé"}
                                  {interview.status === "completed" && "Terminé"}
                                  {interview.status === "cancelled" && "Annulé"}
                                  {interview.status === "rescheduled" && "Reporté"}
                                </Badge>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(interviewDate, "PPP", { locale: fr })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  {format(interviewDate, "HH:mm", { locale: fr })}
                                </div>
                                {interview.location && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {interview.location}
                                  </div>
                                )}
                                {interview.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {interview.type}
                                  </Badge>
                                )}
                              </div>

                              {interview.interviewerName && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  {interview.interviewerName}
                                </div>
                              )}

                              {interview.notes && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {interview.notes}
                                </p>
                              )}

                              {interview.applicationId && (
                                <Link
                                  href={`/applications/${interview.applicationId}`}
                                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  Voir la candidature
                                </Link>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleEdit(interview, e)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDelete(interview.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <InterviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          interview={selectedInterview}
          defaultDate={selectedDate}
          onSuccess={handleDialogClose}
        />

        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title="Supprimer l'entretien"
          description="Êtes-vous sûr de vouloir supprimer cet entretien ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </AppShell>
  )
}
