"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Star, MoreVertical, Building2, MapPin, Calendar, AlertCircle, Clock, AlertTriangle } from "lucide-react"
import type { Application, Company, ApplicationStatus } from "@/db/schema"
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_OPTIONS } from "@/lib/constants/labels"
import { needsAction } from "@/lib/applications-utils"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface KanbanBoardProps {
  applications: (Application & { company?: Company })[]
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => Promise<void>
  onRefresh: () => void
}

const STATUS_COLUMNS: ApplicationStatus[] = ["pending", "in_progress", "accepted", "rejected"]

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
}

export function KanbanBoard({ applications, onStatusChange, onRefresh }: KanbanBoardProps) {
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  const applicationsByStatus = useMemo(() => {
    const grouped: Record<ApplicationStatus, (Application & { company?: Company })[]> = {
      pending: [],
      in_progress: [],
      accepted: [],
      rejected: [],
    }

    applications.forEach((app) => {
      grouped[app.status].push(app)
    })

    return grouped
  }, [applications])

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingIds((prev) => new Set(prev).add(applicationId))
    try {
      await onStatusChange(applicationId, newStatus)
      await onRefresh()
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error)
      toast.error("Erreur lors du changement de statut")
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(applicationId)
        return next
      })
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((status) => {
        const statusApplications = applicationsByStatus[status]
        const actionInfo = statusApplications.map((app) => needsAction(app))
        const needsActionCount = actionInfo.filter((info) => info.needsAction).length

        return (
          <div key={status} className="flex-shrink-0 w-80">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", STATUS_COLORS[status])} />
                    <CardTitle className="text-base font-semibold">
                      {APPLICATION_STATUS_LABELS[status]}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {statusApplications.length}
                  </Badge>
                </div>
                {needsActionCount > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {needsActionCount} action{needsActionCount > 1 ? "s" : ""} requise{needsActionCount > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(100vh-20rem)] space-y-3">
                {statusApplications.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Aucune candidature
                  </div>
                ) : (
                  statusApplications.map((application) => {
                    const actionInfo = needsAction(application)
                    const isUpdating = updatingIds.has(application.id)
                    const urgencyIcons = {
                      high: AlertCircle,
                      medium: Clock,
                      low: Clock,
                    }
                    const urgencyColors = {
                      high: "text-red-600 dark:text-red-400",
                      medium: "text-orange-600 dark:text-orange-400",
                      low: "text-yellow-600 dark:text-yellow-400",
                    }
                    const ActionIcon = actionInfo.needsAction
                      ? urgencyIcons[actionInfo.urgency!]
                      : null
                    const iconColor = actionInfo.needsAction
                      ? urgencyColors[actionInfo.urgency!]
                      : ""

                    return (
                      <Card
                        key={application.id}
                        className={cn(
                          "hover:shadow-md transition-all cursor-pointer",
                          isUpdating && "opacity-50 pointer-events-none"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/applications/${application.id}`}
                                className="flex-1 hover:underline"
                              >
                                <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                                  {application.title}
                                </h4>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {APPLICATION_STATUS_OPTIONS.filter(
                                    (opt) => opt.value !== status
                                  ).map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(application.id, option.value)
                                      }}
                                      disabled={isUpdating}
                                    >
                                      Déplacer vers {APPLICATION_STATUS_LABELS[option.value]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {application.company && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{application.company.name}</span>
                              </div>
                            )}

                            {application.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{application.location}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                {application.priority && (
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                )}
                                {actionInfo.needsAction && ActionIcon && (
                                  <ActionIcon className={cn("h-3 w-3", iconColor)} title={actionInfo.reason || ""} />
                                )}
                              </div>
                              {application.appliedAt && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {format(new Date(application.appliedAt), "d MMM", { locale: fr })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

