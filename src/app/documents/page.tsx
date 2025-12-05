 "use client"

import { AppShell } from "@/components/layout/app-shell"

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          CV & lettres
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Prépare et gère tes CV et lettres de motivation optimisés avec l&apos;IA
          pour chaque candidature.
        </p>
        <div className="mt-6 rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Zone de contenu à venir : générateur de CV, modèles de lettres,
          historique des documents et export PDF/Word.
        </div>
      </div>
    </AppShell>
  )
}



