 "use client"

import React from "react"
import Link from "next/link"
import { Briefcase } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground flex")}>
      <aside className="hidden md:flex w-60 flex-col border-r border-border/60 bg-muted/20 px-4 py-6 gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          <span className="font-semibold">JobTrackr</span>
        </Link>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="text-foreground/80 hover:text-foreground">
            Tableau de bord
          </Link>
          <Link href="/applications" className="text-foreground/60 hover:text-foreground">
            Candidatures
          </Link>
          <Link href="/documents" className="text-foreground/60 hover:text-foreground">
            CV & Lettres
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2 md:hidden">
            <Briefcase className="h-5 w-5" />
            <span className="font-semibold">JobTrackr</span>
          </div>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            Mon compte
          </Button>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 bg-gradient-to-b from-background to-background/80">
          {children}
        </main>
      </div>
    </div>
  )
}



