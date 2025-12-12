"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Mail, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/client"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ 
    name: string
    email: string
    emailVerified: boolean
    createdAt?: string
  } | null>(null)
  const [name, setName] = useState("")

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/auth/user")
      if (response.ok) {
        const result = await response.json()
        const userData = result.data
        setUser({
          name: userData.name || "",
          email: userData.email || "",
          emailVerified: userData.emailVerified || false,
          createdAt: userData.createdAt,
        })
        setName(userData.name || "")
      } else {
        toast.error("Erreur lors du chargement du profil")
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom ne peut pas être vide")
      return
    }

    setSaving(true)
    try {
      // Better Auth gère la mise à jour via l'API
      const response = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la mise à jour")
      }

      toast.success("Profil mis à jour avec succès")
      await fetchUser() // Recharger les données
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>Impossible de charger le profil utilisateur</CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-8 w-8" />
            Paramètres
          </h1>
          <p className="text-muted-foreground mt-1">
            Gère ton profil et tes préférences
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>
              Informations de ton compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ton nom"
                  disabled={saving}
                  className="max-w-md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="max-w-md bg-muted"
                />
                {user.emailVerified ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ✓ Vérifié
                  </span>
                ) : (
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Non vérifié
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                L&apos;email ne peut pas être modifié depuis cette page.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving || name.trim() === user.name}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du compte</CardTitle>
            <CardDescription>
              Détails de ton compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Compte créé le</div>
                <div className="font-medium">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Statut</div>
                <div className="font-medium">
                  {user.emailVerified ? "Compte vérifié" : "En attente de vérification"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

