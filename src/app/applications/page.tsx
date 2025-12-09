"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ApplicationsList } from "@/components/applications/applications-list"
import type { Application, Company } from "@/db/schema"
import { Briefcase, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<
    (Application & { company?: Company })[]
  >([])
  const [loading, setLoading] = useState(true)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/applications")
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      } else {
        console.error("Erreur lors du chargement des candidatures")
      }
    } catch (error) {
      console.error("Erreur lors du chargement des candidatures:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Section */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Candidatures
            </h1>
          </div>
          <p className="text-muted-foreground text-md leading-relaxed">
              Centralise et suis toutes tes candidatures : statuts, entreprises,
              dates clés et prochaines actions.
          </p>
          {/* Stats Cards */}
          {!loading && applications.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4 mt-6">
              <Card className="p-4 border-primary/10 bg-gradient-to-br from-card to-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold mt-1">{applications.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-primary/10 bg-gradient-to-br from-card to-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold mt-1">
                      {applications.filter(a => a.status === "pending").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-primary/10 bg-gradient-to-br from-card to-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <p className="text-2xl font-bold mt-1">
                      {applications.filter(a => a.status === "in_progress").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
              </Card>
              <Card className="p-4 border-primary/10 bg-gradient-to-br from-card to-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Acceptées</p>
                    <p className="text-2xl font-bold mt-1">
                      {applications.filter(a => a.status === "accepted").length}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 flex-1 max-w-md" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Card className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <ApplicationsList
            applications={applications}
            onRefresh={fetchApplications}
          />
        )}
      </div>
    </AppShell>
  )
}



