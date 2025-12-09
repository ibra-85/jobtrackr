"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, Copy, CheckCircle2, Clock, XCircle, Circle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import type { ApplicationWithCompany } from "./columns"
import type { ApplicationStatus } from "@/db/schema"

interface DataTableRowActionsProps {
  row: Row<ApplicationWithCompany>
  onEdit?: (application: ApplicationWithCompany) => void
  onDelete?: (application: ApplicationWithCompany) => void
  onDuplicate?: (id: string) => void
  onStatusChange?: (id: string, status: ApplicationStatus) => void
  deletingId?: string | null
  duplicatingId?: string | null
  updatingStatusId?: string | null
}

const statusOptions: { value: ApplicationStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "pending", label: "En attente", icon: Clock },
  { value: "in_progress", label: "En cours", icon: Circle },
  { value: "accepted", label: "Acceptée", icon: CheckCircle2 },
  { value: "rejected", label: "Refusée", icon: XCircle },
]

export function DataTableRowActions({
  row,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  deletingId,
  duplicatingId,
  updatingStatusId,
}: DataTableRowActionsProps) {
  const application = row.original
  const isUpdating = updatingStatusId === application.id

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit?.(application)}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDuplicate?.(application.id)}
          disabled={duplicatingId === application.id}
        >
          <Copy className="mr-2 h-4 w-4" />
          Dupliquer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isUpdating}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Changer le statut
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusOptions.map((option) => {
              const Icon = option.icon
              const isSelected = application.status === option.value
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStatusChange?.(application.id, option.value)}
                  disabled={isSelected || isUpdating}
                  className={isSelected ? "bg-accent" : ""}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {option.label}
                  {isSelected && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete?.(application)}
          disabled={deletingId === application.id}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

