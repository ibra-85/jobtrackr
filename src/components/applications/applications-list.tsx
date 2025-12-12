"use client"

import { useState } from "react"
import { FileText, Briefcase, Plus, AlertTriangle, LayoutGrid, List } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Application, Company, ApplicationStatus } from "@/db/schema"
import { ApplicationForm } from "./application-form"
import { toast } from "sonner"
import { columns, type ApplicationWithCompany } from "./columns"
import { DataTable } from "./data-table"
import { DataTableToolbar } from "./data-table-toolbar"
import { DataTableRowActions } from "./data-table-row-actions"
import { KanbanBoard } from "./kanban-board"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ApplicationsListProps {
  applications: (Application & { company?: Company })[]
  onRefresh: () => void
}

export function ApplicationsList({ applications, onRefresh }: ApplicationsListProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [editingApplication, setEditingApplication] = useState<
    ApplicationWithCompany | undefined
  >(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<ApplicationWithCompany | null>(null)

  const handleCreate = () => {
    setEditingApplication(undefined)
    setFormOpen(true)
  }


  const handleEdit = (application: ApplicationWithCompany) => {
    setEditingApplication(application)
    setFormOpen(true)
  }

  const handleDelete = (application: ApplicationWithCompany) => {
    setApplicationToDelete(application)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!applicationToDelete) return

    setDeletingId(applicationToDelete.id)
    setDeleteDialogOpen(false)
    
    try {
      const response = await fetch(`/api/applications/${applicationToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }

      toast.success("Candidature supprimée avec succès")
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression",
      )
    } finally {
      setDeletingId(null)
      setApplicationToDelete(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)
    try {
      const response = await fetch(`/api/applications/${id}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }

      toast.success("Candidature dupliquée avec succès")
      onRefresh()
    } catch (error) {
      console.error("Erreur lors de la duplication:", error)
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la duplication",
      )
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleStatusChange = async (id: string, status: string | ApplicationStatus) => {
    setUpdatingStatusId(id)
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }

      toast.success("Statut mis à jour avec succès")
      onRefresh()
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error)
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du changement de statut",
      )
      // Ne pas throw l'erreur pour la compatibilité avec DataTableRowActions
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Adapter les colonnes pour passer les handlers
  const columnsWithActions = columns.map((column) => {
    if (column.id === "actions") {
      return {
        ...column,
        cell: ({ row }: { row: any }) => (
          <DataTableRowActions
            row={row}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onStatusChange={handleStatusChange}
            deletingId={deletingId}
            duplicatingId={duplicatingId}
            updatingStatusId={updatingStatusId}
          />
        ),
      }
    }
    return column
  })

  if (applications.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center w-full min-h-[calc(100vh-20rem)]">
          <EmptyState
            title="Aucune candidature"
            description="Commence par créer ta première candidature pour suivre ta recherche d'emploi et organiser tes démarches."
            icons={[FileText, Briefcase, Plus]}
            action={{
              label: "Créer ma première candidature",
              onClick: handleCreate,
            }}
            className="w-full max-w-5xl"
          />
        </div>
        <ApplicationForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingApplication(undefined)
            }
          }}
          application={editingApplication}
          onSuccess={() => {
            onRefresh()
            toast.success("Candidature créée avec succès")
          }}
        />
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <DialogTitle>Supprimer la candidature</DialogTitle>
                  <DialogDescription className="mt-1">
                    Cette action est irréversible.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Es-tu sûr de vouloir supprimer la candidature{" "}
                <span className="font-semibold text-foreground">
                  &quot;{applicationToDelete?.title}&quot;
                </span>
                ? Cette action ne peut pas être annulée.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setApplicationToDelete(null)
                }}
                disabled={deletingId !== null}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deletingId !== null}
              >
                {deletingId ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "kanban")}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "list" ? (
        <DataTable 
          columns={columnsWithActions} 
          data={applications} 
          onCreateClick={handleCreate}
          onRefresh={onRefresh}
        />
      ) : (
        <KanbanBoard
          applications={applications}
          onStatusChange={(id, status) => handleStatusChange(id, status)}
          onRefresh={onRefresh}
        />
      )}
      <ApplicationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingApplication(undefined)
          }
        }}
        application={editingApplication}
        onSuccess={() => {
          onRefresh()
          toast.success(
            editingApplication
              ? "Candidature modifiée avec succès"
              : "Candidature créée avec succès",
          )
        }}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Supprimer la candidature</DialogTitle>
                <DialogDescription className="mt-1">
                  Cette action est irréversible.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Es-tu sûr de vouloir supprimer la candidature{" "}
              <span className="font-semibold text-foreground">
                &quot;{applicationToDelete?.title}&quot;
              </span>
              ? Cette action ne peut pas être annulée.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setApplicationToDelete(null)
              }}
              disabled={deletingId !== null}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletingId !== null}
            >
              {deletingId ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
