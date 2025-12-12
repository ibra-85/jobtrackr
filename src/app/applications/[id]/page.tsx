"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Edit,
  Calendar,
  Building2,
  Briefcase,
  Clock,
  ExternalLink,
  MapPin,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Star,
  Mail,
} from "lucide-react"
import Link from "next/link"
import type {
  Application,
  ApplicationStatus,
  Company,
  Activity,
  ContractType,
  ApplicationSource,
  CompanySize,
  CompanyType,
  WorkMode,
} from "@/db/schema"
import { ApplicationForm } from "@/components/applications/application-form"
import { NotesSection } from "@/components/applications/notes-section"
import { ContactsSection } from "@/components/applications/contacts-section"
import { InterviewsSection } from "@/components/applications/interviews-section"
import { CompanyEditDialog } from "@/components/applications/company-edit-dialog"
import { FollowUpEmailDialog } from "@/components/applications/follow-up-email-dialog"
import { AISuggestionsButton } from "@/components/applications/ai-suggestions-button"
import { toast } from "sonner"
import {
  getLastInteraction,
  getDaysSinceLastInteraction,
  suggestNextAction,
  formatDaysAgo,
} from "@/lib/applications-utils"
import {
  APPLICATION_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  APPLICATION_SOURCE_LABELS,
  COMPANY_SIZE_LABELS,
  COMPANY_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/constants/labels"

const statusColors: Record<ApplicationStatus, "default" | "secondary" | "outline"> = {
  pending: "secondary",
  in_progress: "default",
  accepted: "default",
  rejected: "outline",
}

const activityTypeLabels: Record<string, string> = {
  application_created: "Candidature créée",
  application_updated: "Candidature modifiée",
  application_status_changed: "Statut modifié",
  interview_scheduled: "Entretien programmé",
  note_added: "Note ajoutée",
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [application, setApplication] = useState<(Application & { company?: Company }) | null>(
    null,
  )
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [companyEditDialogOpen, setCompanyEditDialogOpen] = useState(false)
  const [followUpEmailDialogOpen, setFollowUpEmailDialogOpen] = useState(false)

  useEffect(() => {
    fetchApplication()
    fetchActivities()
  }, [id])

  const fetchApplication = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${id}`)
      if (response.ok) {
        const result = await response.json()
        setApplication(result.data)
      } else if (response.status === 404) {
        toast.error("Candidature non trouvée")
        router.push("/applications")
      } else {
        toast.error("Erreur lors du chargement de la candidature")
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      toast.error("Erreur lors du chargement de la candidature")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/applications/${id}/activities`)
      if (response.ok) {
        const result = await response.json()
        setActivities(result.data || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error)
      setActivities([])
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

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    )
  }

  if (!application) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Candidature non trouvée</CardTitle>
            <CardDescription>
              La candidature que tu recherches n&apos;existe pas ou tu n&apos;as pas les droits pour
              y accéder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux candidatures
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link href="/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{application.title}</h1>
              {application.priority && (
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusColors[application.status]}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
              {application.priority && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
                  Prioritaire
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <AISuggestionsButton applicationId={id} />
            <Button onClick={() => setFollowUpEmailDialogOpen(true)} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Email de relance
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Informations de la candidature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Titre du poste</div>
                  <div className="text-base">{application.title}</div>
                </div>
                {application.company && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Entreprise
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-base font-medium">{application.company.name}</div>
                        {application.company.website && (
                          <a
                            href={application.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            {application.company.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {application.company.sector && (
                          <div className="text-sm text-muted-foreground mt-1">{application.company.sector}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCompanyEditDialogOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Statut</div>
                  <Badge variant={statusColors[application.status]}>
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </Badge>
                </div>
                {(application.appliedAt ||
                  application.deadline ||
                  application.contractType ||
                  application.location ||
                  application.salaryRange ||
                  application.source ||
                  application.jobUrl) && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    {application.appliedAt && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date de candidature
                        </div>
                        <div className="text-sm">{formatDateShort(application.appliedAt)}</div>
                      </div>
                    )}
                    {application.deadline && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Date limite
                        </div>
                        <div className="text-sm">{formatDateShort(application.deadline)}</div>
                      </div>
                    )}
                    {application.contractType && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          Type de contrat
                        </div>
                        <div className="text-sm">{CONTRACT_TYPE_LABELS[application.contractType]}</div>
                      </div>
                    )}
                    {application.source && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Source</div>
                        <div className="text-sm">{APPLICATION_SOURCE_LABELS[application.source]}</div>
                      </div>
                    )}
                    {application.location && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Localisation
                        </div>
                        <div className="text-sm">{application.location}</div>
                      </div>
                    )}
                    {application.salaryRange && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Fourchette salariale
                        </div>
                        <div className="text-sm">{application.salaryRange}</div>
                      </div>
                    )}
                    {application.jobUrl && (
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Lien vers l'offre
                        </div>
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {application.jobUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Créée le
                    </div>
                    <div className="text-sm">{formatDateShort(application.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Modifiée le
                    </div>
                    <div className="text-sm">{formatDateShort(application.updatedAt)}</div>
                  </div>
                </div>
                {application.notes && (
                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes personnelles
                    </div>
                    <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {application.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <NotesSection applicationId={id} />
            <InterviewsSection applicationId={id} />

            {/* Suivi & Activités */}
            <Card>
              <CardHeader>
                <CardTitle>Suivi et activités</CardTitle>
                <CardDescription>
                  Dernière interaction, prochaine action suggérée et historique des actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activities.length > 0 && (() => {
                  const lastInteraction = getLastInteraction(activities)
                  const daysSince = getDaysSinceLastInteraction(activities)
                  const nextAction = suggestNextAction(application, activities)
                  
                  return (
                    <>
                      {lastInteraction && (
                        <div className="pb-4 border-b">
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Dernière interaction
                          </div>
                          <div className="text-sm">
                            {activityTypeLabels[lastInteraction.type] || lastInteraction.type}
                            {daysSince !== null && (
                              <span className="text-muted-foreground ml-2">
                                ({formatDaysAgo(daysSince)})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(lastInteraction.createdAt)}
                          </p>
                        </div>
                      )}
                      {nextAction && (
                        <div className="pb-4 border-b">
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Prochaine action suggérée
                          </div>
                          <div className={`text-sm ${
                            nextAction.urgency === "high" 
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : nextAction.urgency === "medium"
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-muted-foreground"
                          }`}>
                            {nextAction.action}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Historique des activités
                  </div>
                  {activities.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Aucune activité enregistrée pour cette candidature.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-4 pb-3 border-b last:border-0">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {activityTypeLabels[activity.type] || activity.type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contacts */}
          <div className="space-y-6">
            {/* Contacts Section */}
            <ContactsSection applicationId={id} />
          </div>
        </div>

        {/* Edit Form Dialog */}
        <ApplicationForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              fetchApplication()
            }
          }}
          application={application}
          onSuccess={() => {
            fetchApplication()
            fetchActivities()
            toast.success("Candidature modifiée avec succès")
          }}
        />

        {application?.company && (
          <CompanyEditDialog
            open={companyEditDialogOpen}
            onOpenChange={setCompanyEditDialogOpen}
            company={application.company}
            onSuccess={() => {
              fetchApplication()
              toast.success("Entreprise modifiée avec succès")
            }}
          />
        )}

        <FollowUpEmailDialog
          open={followUpEmailDialogOpen}
          onOpenChange={setFollowUpEmailDialogOpen}
          applicationId={id}
        />
      </div>
    </AppShell>
  )
}

