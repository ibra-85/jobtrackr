"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { DocumentType } from "@/db/schema"

interface DocumentGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: DocumentType
  onGenerated?: (title: string, content: string) => void
}

export function DocumentGenerateDialog({
  open,
  onOpenChange,
  type,
  onGenerated,
}: DocumentGenerateDialogProps) {
  const [context, setContext] = useState("")
  const [userProfile, setUserProfile] = useState("")
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!open) {
      setContext("")
      setUserProfile("")
    }
  }, [open])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          context: context.trim() || undefined,
          userProfile: userProfile.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la génération")
      }

      const result = await response.json()
      toast.success("Document généré avec succès")

      onGenerated?.(result.data.title, result.data.content)
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const documentTypeLabel = type === "cv" ? "CV" : "Lettre de motivation"
  const contextPlaceholder =
    type === "cv"
      ? "Ex: Développeur Full Stack, spécialisé React/Node.js, 5 ans d'expérience"
      : "Ex: Poste de Développeur React chez TechCorp, annonce LinkedIn du 15/01/2025"
  const profilePlaceholder =
    type === "cv"
      ? "Ex: Compétences: React, Node.js, TypeScript. Expériences: 5 ans chez StartupX..."
      : "Ex: 5 ans d'expérience en développement web, spécialisé React..."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Générer un {documentTypeLabel} avec l&apos;IA
          </DialogTitle>
          <DialogDescription>
            Laisse l&apos;IA créer un {documentTypeLabel.toLowerCase()} professionnel basé sur le
            contexte que tu fournis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="context">
              {type === "cv" ? "Contexte professionnel" : "Contexte de candidature"}
            </Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={contextPlaceholder}
              rows={4}
              disabled={generating}
            />
            <p className="text-xs text-muted-foreground">
              {type === "cv"
                ? "Décris ton profil professionnel, tes compétences, expériences..."
                : "Décris le poste visé, l'entreprise, les informations de l'offre..."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userProfile">Profil détaillé (optionnel)</Label>
            <Textarea
              id="userProfile"
              value={userProfile}
              onChange={(e) => setUserProfile(e.target.value)}
              placeholder={profilePlaceholder}
              rows={5}
              disabled={generating}
            />
            <p className="text-xs text-muted-foreground">
              Informations complémentaires : compétences techniques, expériences détaillées,
              formations, certifications...
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec l&apos;IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

