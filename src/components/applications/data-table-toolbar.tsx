"use client"

import { Table } from "@tanstack/react-table"
import { X, Search, CirclePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import type { ApplicationWithCompany } from "./columns"
import type { ApplicationStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

const statusOptions: {
  label: string
  value: ApplicationStatus
}[] = [
  {
    label: "En attente",
    value: "pending",
  },
  {
    label: "En cours",
    value: "in_progress",
  },
  {
    label: "Acceptée",
    value: "accepted",
  },
  {
    label: "Refusée",
    value: "rejected",
  },
]

interface DataTableToolbarProps {
  table: Table<ApplicationWithCompany>
  onCreateClick: () => void
}

export function DataTableToolbar({ table, onCreateClick }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            placeholder="Rechercher par titre ou entreprise..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className={cn(
              "h-9 pl-8",
              "bg-background/50 backdrop-blur-sm",
              "border-border/50 focus:border-border",
              "transition-all"
            )}
          />
        </div>
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            title="Statut"
            options={statusOptions}
            selectedValues={
              (table.getColumn("status")?.getFilterValue() as Set<string>) ?? new Set()
            }
            onSelectedValuesChange={(values) =>
              table.getColumn("status")?.setFilterValue(values.size > 0 ? values : undefined)
            }
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className={cn(
              "h-9 px-3",
              "hover:bg-destructive/10 hover:text-destructive",
              "transition-colors"
            )}
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <Button 
        onClick={onCreateClick} 
        size="sm"
        className={cn(
          "gap-2",
          "shadow-sm hover:shadow-md",
          "transition-all"
        )}
      >
        <CirclePlus className="h-4 w-4" />
        <span className="hidden sm:inline">Nouvelle candidature</span>
        <span className="sm:hidden">Nouvelle</span>
      </Button>
    </div>
  )
}

