"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ApplicationNote } from "@/db/schema"

interface NotesSectionProps {
  applicationId: string
}

export function NotesSection({ applicationId }: NotesSectionProps) {
  const [notes, setNotes] = useState<ApplicationNote[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<ApplicationNote | null>(null)
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [applicationId])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/applications/${applicationId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (note?: ApplicationNote) => {
    if (note) {
      setEditingNote(note)
      setContent(note.content)
    } else {
      setEditingNote(null)
      setContent("")
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Le contenu de la note ne peut pas être vide")
      return
    }

    setSaving(true)
    try {
      if (editingNote) {
        // Mettre à jour
        const response = await fetch(
          `/api/applications/${applicationId}/notes/${editingNote.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim() }),
          },
        )

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour")
        }

        toast.success("Note modifiée avec succès")
      } else {
        // Créer
        const response = await fetch(`/api/applications/${applicationId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la création")
        }

        toast.success("Note ajoutée avec succès")
      }

      setDialogOpen(false)
      setContent("")
      setEditingNote(null)
      fetchNotes()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm("Es-tu sûr de vouloir supprimer cette note ?")) {
      return
    }

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/notes/${noteId}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression")
      }

      toast.success("Note supprimée avec succès")
      fetchNotes()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Une erreur est survenue")
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes personnelles
            </CardTitle>
            <CardDescription>
              Notes libres sur l&apos;entreprise, le poste, le ressenti, feedback d&apos;entretien
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucune note pour cette candidature.
              <br />
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => handleOpenDialog()}
              >
                Ajouter une note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(note)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(note.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(note.createdAt)}
                    {new Date(note.updatedAt).getTime() !== new Date(note.createdAt).getTime() && " (modifiée)"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Modifier la note" : "Nouvelle note"}
            </DialogTitle>
            <DialogDescription>
              {editingNote
                ? "Modifie le contenu de ta note."
                : "Ajoute une note personnelle sur cette candidature."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Écris ta note ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? "Enregistrement..." : editingNote ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

