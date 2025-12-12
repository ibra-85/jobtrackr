"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Plus, MoreVertical, Edit, Trash2, Clock, MapPin, User } from "lucide-react"
import { toast } from "sonner"
import type { Interview } from "@/db/schema"
import { InterviewDialog } from "./interview-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface InterviewsSectionProps {
  applicationId: string
}

export function InterviewsSection({ applicationId }: InterviewsSectionProps) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchInterviews()
  }, [applicationId])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${applicationId}/interviews`)
      if (response.ok) {
        const result = await response.json()
        setInterviews(result.data || [])
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors du chargement des entretiens")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des entretiens:", error)
      toast.error("Erreur lors du chargement des entretiens")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (interview?: Interview) => {
    if (interview) {
      setEditingInterview(interview)
    } else {
      setEditingInterview(null)
    }
    setDialogOpen(true)
  }

  const handleDelete = (interviewId: string) => {
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
        fetchInterviews()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression de l'entretien")
    } finally {
      setInterviewToDelete(null)
    }
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Entretiens
        </CardTitle>
        <CardDescription>
          {interviews.length === 0
            ? "Aucun entretien programmé"
            : `${interviews.length} entretien${interviews.length > 1 ? "s" : ""} programmé${interviews.length > 1 ? "s" : ""}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Aucun entretien programmé pour cette candidature</p>
            <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Programmer un entretien
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((interview) => {
                const isPast = new Date(interview.scheduledAt) < new Date()
                const isToday =
                  new Date(interview.scheduledAt).toDateString() === new Date().toDateString()

                return (
                  <div
                    key={interview.id}
                    className={`p-4 border rounded-lg ${
                      isPast ? "opacity-60" : isToday ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{interview.title}</h3>
                          <Badge
                            variant={
                              interview.status === "scheduled"
                                ? "default"
                                : interview.status === "completed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {interview.status === "scheduled"
                              ? "Programmé"
                              : interview.status === "completed"
                                ? "Terminé"
                                : interview.status === "cancelled"
                                  ? "Annulé"
                                  : "Reporté"}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formatDate(new Date(interview.scheduledAt))} à {formatTime(new Date(interview.scheduledAt))}
                          </div>
                          {interview.duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Durée : {interview.duration}
                            </div>
                          )}
                          {interview.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {interview.location}
                            </div>
                          )}
                          {interview.interviewerName && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {interview.interviewerName}
                              {interview.interviewerEmail && (
                                <span className="text-xs">({interview.interviewerEmail})</span>
                              )}
                            </div>
                          )}
                          {interview.type && (
                            <div className="text-xs">
                              Type :{" "}
                              {interview.type === "phone"
                                ? "Téléphone"
                                : interview.type === "video"
                                  ? "Vidéo"
                                  : interview.type === "on_site"
                                    ? "Sur site"
                                    : interview.type === "technical"
                                      ? "Technique"
                                      : interview.type === "hr"
                                        ? "RH"
                                        : interview.type === "final"
                                          ? "Final"
                                          : "Autre"}
                            </div>
                          )}
                          {interview.notes && (
                            <div className="mt-2 text-xs p-2 bg-muted rounded">
                              {interview.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(interview)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(interview.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>

      <InterviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        interview={editingInterview}
        applicationId={applicationId}
        onSuccess={() => {
          fetchInterviews()
          setEditingInterview(null)
        }}
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
    </Card>
  )
}

