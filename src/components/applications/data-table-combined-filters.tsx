"use client"

import * as React from "react"
import { CheckIcon, Filter } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import type { ApplicationStatus, ContractType, ApplicationSource } from "@/db/schema"

const statusOptions: {
  label: string
  value: ApplicationStatus
}[] = [
  { label: "En attente", value: "pending" },
  { label: "En cours", value: "in_progress" },
  { label: "Acceptée", value: "accepted" },
  { label: "Refusée", value: "rejected" },
]

const sourceOptions: {
  label: string
  value: ApplicationSource
}[] = [
  { label: "LinkedIn", value: "linkedin" },
  { label: "Indeed", value: "indeed" },
  { label: "Welcome to the Jungle", value: "welcome_to_the_jungle" },
  { label: "Site carrière", value: "site_carriere" },
  { label: "Cooptation", value: "cooptation" },
  { label: "Email", value: "email" },
  { label: "Autre", value: "autre" },
]

const contractTypeOptions: {
  label: string
  value: ContractType
}[] = [
  { label: "CDI", value: "cdi" },
  { label: "CDD", value: "cdd" },
  { label: "Stage", value: "stage" },
  { label: "Alternance", value: "alternance" },
  { label: "Freelance", value: "freelance" },
  { label: "Autre", value: "autre" },
]

interface DataTableCombinedFiltersProps {
  statusSelected: Set<string>
  onStatusChange: (values: Set<string>) => void
  sourceSelected: Set<string>
  onSourceChange: (values: Set<string>) => void
  contractTypeSelected: Set<string>
  onContractTypeChange: (values: Set<string>) => void
}

export function DataTableCombinedFilters({
  statusSelected,
  onStatusChange,
  sourceSelected,
  onSourceChange,
  contractTypeSelected,
  onContractTypeChange,
}: DataTableCombinedFiltersProps) {
  const [open, setOpen] = React.useState(false)
  const totalSelected = statusSelected.size + sourceSelected.size + contractTypeSelected.size

  const handleToggle = (
    value: string,
    selected: Set<string>,
    onChange: (values: Set<string>) => void,
  ) => {
    const newSelected = new Set(selected)
    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }
    onChange(newSelected.size > 0 ? newSelected : new Set())
  }

  const handleClearAll = () => {
    onStatusChange(new Set())
    onSourceChange(new Set())
    onContractTypeChange(new Set())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
          {totalSelected > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {totalSelected}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un filtre..." />
          <CommandList>
            <CommandEmpty>Aucun filtre trouvé.</CommandEmpty>
            
            <CommandGroup heading="Statut">
              {statusOptions.map((option) => {
                const isSelected = statusSelected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggle(option.value, statusSelected, onStatusChange)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Source">
              {sourceOptions.map((option) => {
                const isSelected = sourceSelected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggle(option.value, sourceSelected, onSourceChange)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Type de contrat">
              {contractTypeOptions.map((option) => {
                const isSelected = contractTypeSelected.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggle(option.value, contractTypeSelected, onContractTypeChange)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {totalSelected > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClearAll}
                    className="justify-center text-center"
                  >
                    Effacer tous les filtres
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

