"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Briefcase, FileText, LayoutDashboard, Sparkles, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  title?: string
}

const searchCommands = [
  {
    group: "Navigation",
    items: [
      {
        label: "Tableau de bord",
        icon: LayoutDashboard,
        shortcut: "⌘D",
        href: "/dashboard",
      },
      {
        label: "Candidatures",
        icon: Briefcase,
        shortcut: "⌘A",
        href: "/applications",
      },
      {
        label: "CV & Lettres",
        icon: FileText,
        shortcut: "⌘C",
        href: "/documents",
      },
    ],
  },
  {
    group: "Actions rapides",
    items: [
      {
        label: "Nouvelle candidature",
        icon: Briefcase,
        shortcut: "⌘N",
        href: "/applications?new=true",
      },
      {
        label: "Générer un CV",
        icon: Sparkles,
        shortcut: "⌘G",
        href: "/documents?action=generate",
      },
    ],
  },
]

export function SiteHeader({ title }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          
          {/* Search Bar */}
          <div className="flex-1 max-w-xs">
            <Button
              variant="outline"
              className={cn(
                "relative h-9 w-full justify-start rounded-lg",
                "bg-background/50 backdrop-blur-sm",
                "border-border/50 hover:border-border",
                "text-sm text-muted-foreground",
                "hover:bg-accent/50 transition-all",
                "shadow-sm hover:shadow-md"
              )}
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <span className="inline-flex">Rechercher...</span>
              <span className="inline-flex sm:hidden">Rechercher...</span>
              <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Right side - Theme Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Recherche rapide"
        description="Naviguez rapidement dans l'application et accédez aux fonctionnalités"
      >
        <CommandInput placeholder="Tapez une commande ou recherchez..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          {searchCommands.map((group) => (
            <CommandGroup key={group.group} heading={group.group}>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem
                    key={item.label}
                    onSelect={() => runCommand(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
