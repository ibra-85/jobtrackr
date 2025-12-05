"use client"

import { AppShell } from "@/components/layout/app-shell"

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Ici, tu pourras suivre tes candidatures, tes documents générés par l&apos;IA
          et toutes les actions liées à ta recherche d&apos;emploi.
        </p>
        <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Zone de contenu à venir : graphiques, listes de candidatures, rappels, etc.
        </div>
      </div>
    </AppShell>
  )
}



