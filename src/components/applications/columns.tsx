"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Star } from "lucide-react"
import type { Application, ApplicationStatus, Company, ContractType, ApplicationSource } from "@/db/schema"
import {
  APPLICATION_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  APPLICATION_SOURCE_LABELS,
} from "@/lib/constants/labels"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

export type ApplicationWithCompany = Application & { company?: Company }

export const columns: ColumnDef<ApplicationWithCompany>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return (
        <Checkbox
          checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Sélectionner tout"
        />
      )
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Titre" />,
    cell: ({ row }) => {
      const application = row.original
      return (
        <Link 
          href={`/applications/${application.id}`} 
          className="font-semibold hover:text-primary hover:underline transition-colors inline-flex items-center gap-1.5 group"
        >
          <span>{application.title}</span>
          {application.priority && (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          )}
        </Link>
      )
    },
  },
  {
    accessorKey: "company",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Entreprise" />,
    cell: ({ row }) => {
      const company = row.original.company
      if (!company) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <div>
          <div className="font-medium">{company.name}</div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {company.website}
            </a>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const company = row.original.company
      if (!company) return false
      return company.name.toLowerCase().includes(value.toLowerCase())
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as ApplicationStatus
      const statusColorMap: Record<ApplicationStatus, string> = {
        pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
        in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        accepted: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      }
      return (
        <Badge 
          variant="outline" 
          className={statusColorMap[status]}
        >
          {APPLICATION_STATUS_LABELS[status]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || typeof value === "string") return true
      const statusValue = row.getValue(id) as string
      if (value instanceof Set) {
        return value.has(statusValue)
      }
      if (Array.isArray(value)) {
        return value.includes(statusValue)
      }
      return false
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const source = row.original.source
      if (!source) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <Badge variant="secondary" className="text-xs">
          {APPLICATION_SOURCE_LABELS[source]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || typeof value === "string") return true
      const sourceValue = row.original.source
      if (!sourceValue) return false
      if (value instanceof Set) {
        return value.has(sourceValue)
      }
      if (Array.isArray(value)) {
        return value.includes(sourceValue)
      }
      return false
    },
  },
  {
    accessorKey: "contractType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contrat" />,
    cell: ({ row }) => {
      const contractType = row.original.contractType
      if (!contractType) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <span className="text-sm">{CONTRACT_TYPE_LABELS[contractType]}</span>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || typeof value === "string") return true
      const contractTypeValue = row.original.contractType
      if (!contractTypeValue) return false
      if (value instanceof Set) {
        return value.has(contractTypeValue)
      }
      if (Array.isArray(value)) {
        return value.includes(contractTypeValue)
      }
      return false
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Localisation" />,
    cell: ({ row }) => {
      const location = row.original.location
      if (!location) {
        return <span className="text-muted-foreground">—</span>
      }
      return <span className="text-sm">{location}</span>
    },
    filterFn: (row, id, value) => {
      if (!value || typeof value === "string") return true
      const locationValue = row.original.location?.toLowerCase() || ""
      const searchValue = (value as string).toLowerCase()
      return locationValue.includes(searchValue)
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date de création" />,
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return (
        <div className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(new Date(date))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

