 "use client"

import { AppShell } from "@/components/layout/app-shell"

export default function ApplicationsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Candidatures
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Centralise et suis toutes tes candidatures : statuts, entreprises,
          dates clés et prochaines actions.
        </p>
        <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Zone de contenu à venir : tableau des candidatures, filtres, recherche
          et actions rapides (ajouter, modifier, mettre à jour le statut).
        </div>
      </div>
    </AppShell>
  )
}



