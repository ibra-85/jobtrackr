"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { SiteHeader } from "./site-header"

interface AppShellProps {
  children: React.ReactNode
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/applications": "Candidatures",
  "/reminders": "Rappels",
  "/documents": "CV & Lettres",
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  const pageTitle = React.useMemo(() => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname === path || pathname.startsWith(path + "/")) {
        return title
      }
    }
    return "JobTrackr"
  }, [pathname])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 ">
            <main className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 flex-1 min-h-0">
              {children}
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
