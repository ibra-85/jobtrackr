"use client"

import { useState } from "react"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { X, ArrowUpDown, Trash2 } from "lucide-react"
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_OPTIONS } from "@/lib/constants/labels"
import type { ApplicationStatus, ApplicationWithCompany } from "@/db/schema"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DataTableBulkActionsProps {
  table: Table<ApplicationWithCompany>
  onUpdateComplete: () => void
}

export function DataTableBulkActions({ table, onUpdateComplete }: DataTableBulkActionsProps) {
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  const handleBulkStatusUpdate = async (newStatus: ApplicationStatus) => {
    if (selectedCount === 0) return

    setUpdating(true)
    try {
      const applicationIds = selectedRows.map((row) => row.original.id)

      const response = await fetch("/api/applications/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      toast.success(
        `${selectedCount} candidature${selectedCount > 1 ? "s" : ""} mise${selectedCount > 1 ? "s" : ""} à jour avec succès`
      )
      table.resetRowSelection()
      onUpdateComplete()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour"
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return

    setDeleting(true)
    try {
      const applicationIds = selectedRows.map((row) => row.original.id)

      const response = await fetch("/api/applications/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      toast.success(
        `${selectedCount} candidature${selectedCount > 1 ? "s" : ""} supprimée${selectedCount > 1 ? "s" : ""} avec succès`
      )
      table.resetRowSelection()
      onUpdateComplete()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression"
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Supprimer les candidatures"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedCount} candidature${selectedCount > 1 ? "s" : ""} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
      <div className="flex items-center gap-2 flex-1">
        <Badge variant="secondary" className="font-medium">
          {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Actions disponibles pour les candidatures sélectionnées
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={updating || deleting}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Changer le statut
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleBulkStatusUpdate(option.value)}
                disabled={updating || deleting}
                className="cursor-pointer"
              >
                {APPLICATION_STATUS_LABELS[option.value]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          disabled={updating || deleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetRowSelection()}
          disabled={updating || deleting}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Désélectionner tout</span>
        </Button>
      </div>
    </div>
    </>
  )
}

