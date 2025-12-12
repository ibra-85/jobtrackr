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
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Document, DocumentType } from "@/db/schema"

interface DocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: Document | null
  type?: DocumentType
  initialContent?: { title: string; content: string } | null
  onSuccess?: () => void
}

export function DocumentDialog({
  open,
  onOpenChange,
  document,
  type,
  initialContent,
  onSuccess,
}: DocumentDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (document) {
        setTitle(document.title)
        setContent(document.content)
      } else if (initialContent) {
        setTitle(initialContent.title)
        setContent(initialContent.content)
      } else {
        setTitle("")
        setContent("")
      }
    }
  }, [open, document, initialContent])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis")
      return
    }
    if (!content.trim()) {
      toast.error("Le contenu est requis")
      return
    }

    const documentType = type || document?.type
    if (!documentType) {
      toast.error("Le type de document est requis")
      return
    }

    setSaving(true)
    try {
      if (document) {
        // Mettre à jour
        const response = await fetch(`/api/documents/${document.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la mise à jour")
        }

        toast.success("Document mis à jour avec succès")
      } else {
        // Créer
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: documentType,
            title: title.trim(),
            content: content.trim(),
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erreur lors de la création")
        }

        toast.success("Document créé avec succès")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  const documentTypeLabel = type || document?.type === "cv" ? "CV" : "Lettre de motivation"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document ? `Modifier ${documentTypeLabel}` : `Nouveau ${documentTypeLabel}`}
          </DialogTitle>
          <DialogDescription>
            {document
              ? `Modifie le contenu de ton ${documentTypeLabel.toLowerCase()}.`
              : `Crée un nouveau ${documentTypeLabel.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="document-title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Ex: ${documentTypeLabel} - Poste développeur`}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-content">
              Contenu <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="document-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Saisis le contenu de ton ${documentTypeLabel.toLowerCase()}...`}
              className="min-h-[400px] font-mono text-sm"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              {content.length} caractères
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : document ? (
              "Modifier"
            ) : (
              "Créer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

