"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import type { ApplicationWithCompany } from "./columns"

interface DataTableProps {
  columns: ColumnDef<ApplicationWithCompany>[]
  data: ApplicationWithCompany[]
  onCreateClick?: () => void
}

export function DataTable({ columns, data, onCreateClick }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase()
      const application = row.original
      
      // Recherche dans le titre
      if (application.title?.toLowerCase().includes(search)) return true
      
      // Recherche dans l'entreprise
      if (application.company?.name?.toLowerCase().includes(search)) return true
      
      // Recherche dans la localisation
      if (application.location?.toLowerCase().includes(search)) return true
      
      // Recherche dans le statut (label)
      const statusLabels: Record<string, string> = {
        pending: "en attente",
        in_progress: "en cours",
        accepted: "acceptée",
        rejected: "refusée",
      }
      if (application.status && statusLabels[application.status]?.includes(search)) return true
      
      // Recherche dans la source (label)
      const sourceLabels: Record<string, string> = {
        linkedin: "linkedin",
        indeed: "indeed",
        welcome_to_the_jungle: "welcome to the jungle",
        site_carriere: "site carrière",
        cooptation: "cooptation",
        email: "email",
        autre: "autre",
      }
      if (application.source && sourceLabels[application.source]?.includes(search)) return true
      
      // Recherche dans le type de contrat (label)
      const contractLabels: Record<string, string> = {
        cdi: "cdi",
        cdd: "cdd",
        stage: "stage",
        alternance: "alternance",
        freelance: "freelance",
        autre: "autre",
      }
      if (application.contractType && contractLabels[application.contractType]?.includes(search)) return true
      
      return false
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-4">
      {onCreateClick && <DataTableToolbar table={table} onCreateClick={onCreateClick} />}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow 
                  key={headerGroup.id}
                  className="border-b bg-muted/30 hover:bg-muted/30"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className="font-semibold text-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-muted/50 transition-colors border-b border-border/50",
                      row.getIsSelected() && "bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Aucun résultat trouvé
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Essayez de modifier vos filtres de recherche
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

