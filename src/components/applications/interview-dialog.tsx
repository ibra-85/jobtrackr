"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker"
import { TimeWithIcon } from "@/components/ui/time-with-icon"
import type { Interview, InterviewType, InterviewStatus, Application } from "@/db/schema"

interface InterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview?: Interview | null
  defaultDate?: Date | null
  applicationId?: string
  onSuccess?: () => void
}

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "phone", label: "Téléphone" },
  { value: "video", label: "Vidéo (Zoom, Teams, etc.)" },
  { value: "on_site", label: "Sur site" },
  { value: "technical", label: "Technique" },
  { value: "hr", label: "RH" },
  { value: "final", label: "Final" },
  { value: "autre", label: "Autre" },
]

const INTERVIEW_STATUSES: { value: InterviewStatus; label: string }[] = [
  { value: "scheduled", label: "Programmé" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
  { value: "rescheduled", label: "Reporté" },
]

export function InterviewDialog({
  open,
  onOpenChange,
  interview,
  defaultDate,
  applicationId,
  onSuccess,
}: InterviewDialogProps) {
  const [title, setTitle] = useState("")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState("")
  const [duration, setDuration] = useState("")
  const [location, setLocation] = useState("")
  const [type, setType] = useState<InterviewType | "">("")
  const [interviewerName, setInterviewerName] = useState("")
  const [interviewerEmail, setInterviewerEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<InterviewStatus>("scheduled")
  const [saving, setSaving] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(applicationId || "")
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)

  // Charger les candidatures si applicationId n'est pas fourni
  useEffect(() => {
    if (open && !applicationId && !interview) {
      setLoadingApplications(true)
      fetch("/api/applications")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setApplications(data.data)
          }
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des candidatures:", error)
        })
        .finally(() => {
          setLoadingApplications(false)
        })
    }
  }, [open, applicationId, interview])

  useEffect(() => {
    if (open) {
      if (interview) {
        // Mode édition
        setTitle(interview.title)
        const date = new Date(interview.scheduledAt)
        setScheduledDate(date)
        setScheduledTime(
          `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
        )
        setDuration(interview.duration || "")
        setLocation(interview.location || "")
        setType(interview.type || "")
        setInterviewerName(interview.interviewerName || "")
        setInterviewerEmail(interview.interviewerEmail || "")
        setNotes(interview.notes || "")
        setStatus(interview.status)
        setSelectedApplicationId(interview.applicationId)
      } else {
        // Mode création
        const date = defaultDate || new Date()
        setTitle("")
        setScheduledDate(date)
        setScheduledTime(
          `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
        )
        setDuration("")
        setLocation("")
        setType("")
        setInterviewerName("")
        setInterviewerEmail("")
        setNotes("")
        setStatus("scheduled")
        setSelectedApplicationId(applicationId || "")
      }
    }
  }, [open, interview, defaultDate, applicationId])

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Le titre de l'entretien est requis")
      return
    }

    if (!scheduledDate) {
      toast.error("La date de l'entretien est requise")
      return
    }

    if (!scheduledTime) {
      toast.error("L'heure de l'entretien est requise")
      return
    }

    // Combiner date et heure
    const [hours, minutes] = scheduledTime.split(":")
    const scheduledDateTime = new Date(scheduledDate)
    scheduledDateTime.setHours(parseInt(hours, 10))
    scheduledDateTime.setMinutes(parseInt(minutes, 10))

    const data = {
      title: title.trim(),
      scheduledAt: scheduledDateTime.toISOString(),
      duration: duration.trim() || undefined,
      location: location.trim() || undefined,
      type: type || undefined,
      interviewerName: interviewerName.trim() || undefined,
      interviewerEmail: interviewerEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    }

    setSaving(true)
    try {
      if (interview) {
        // Mise à jour
        const response = await fetch(`/api/interviews/${interview.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la mise à jour")
        }

        toast.success("Entretien modifié avec succès")
      } else {
        // Création
        const finalApplicationId = applicationId || selectedApplicationId
        if (!finalApplicationId) {
          toast.error("Veuillez sélectionner une candidature")
          return
        }

        const response = await fetch(`/api/applications/${finalApplicationId}/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la création")
        }

        toast.success("Entretien créé avec succès")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{interview ? "Modifier l'entretien" : "Nouvel entretien"}</DialogTitle>
          <DialogDescription>
            {interview
              ? "Modifiez les informations de l'entretien"
              : "Remplissez les informations pour créer un nouvel entretien"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!applicationId && !interview && (
            <div className="space-y-2">
              <Label htmlFor="applicationId">
                Candidature <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedApplicationId}
                onValueChange={setSelectedApplicationId}
                disabled={loadingApplications || saving}
              >
                <SelectTrigger id="applicationId">
                  <SelectValue placeholder="Sélectionner une candidature" />
                </SelectTrigger>
                <SelectContent>
                  {loadingApplications ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : applications.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Aucune candidature disponible
                    </SelectItem>
                  ) : (
                    applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Entretien technique, Entretien RH, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Sélectionner une date"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <TimeWithIcon
                label={
                  <>
                    Heure <span className="text-destructive">*</span>
                  </>
                }
                value={scheduledTime}
                onChange={setScheduledTime}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 30 min, 1h, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as InterviewType)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localisation</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Bureau Paris, Remote (Zoom), etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interviewerName">Nom de l'interviewer</Label>
              <Input
                id="interviewerName"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="Ex: Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interviewerEmail">Email de l'interviewer</Label>
              <Input
                id="interviewerEmail"
                type="email"
                value={interviewerEmail}
                onChange={(e) => setInterviewerEmail(e.target.value)}
                placeholder="jean.dupont@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as InterviewStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes préparatoires ou post-entretien..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Enregistrement..." : interview ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

