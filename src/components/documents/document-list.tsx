"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, Plus, MoreVertical, Edit, Trash2, Sparkles, FileBadge } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { Document, DocumentType } from "@/db/schema"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface DocumentListProps {
  type?: DocumentType
  onDocumentSelect?: (document: Document) => void
  refreshKey?: number // Pour forcer le refresh
}

export function DocumentList({ type, onDocumentSelect, refreshKey }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [type, refreshKey])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const url = type ? `/api/documents?type=${type}` : "/api/documents"
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setDocuments(result.data || [])
      } else {
        toast.error("Erreur lors du chargement des documents")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (documentId: string) => {
    setDocumentToDelete(documentId)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await fetch(`/api/documents/${documentToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Document supprimé avec succès")
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete))
        fetchDocuments()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    } finally {
      setDocumentToDelete(null)
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

  const documentTypeLabels: Record<DocumentType, string> = {
    cv: "CV",
    cover_letter: "Lettre de motivation",
  }

  const filteredDocuments = type
    ? documents.filter((doc) => doc.type === type)
    : documents

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded w-48" />
              <div className="h-4 bg-muted animate-pulse rounded w-32 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredDocuments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {type ? `Aucun ${documentTypeLabels[type]}` : "Aucun document"}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {type
              ? `Tu n'as pas encore de ${documentTypeLabels[type]}. Crée-en un pour commencer.`
              : "Tu n'as pas encore de documents. Crée un CV ou une lettre de motivation pour commencer."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id} className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{document.title}</CardTitle>
                    <Badge variant="outline">
                      {documentTypeLabels[document.type]}
                    </Badge>
                  </div>
                  <CardDescription>
                    Modifié le {formatDate(document.updatedAt)}
                  </CardDescription>
                  {document.content && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {document.content.substring(0, 200)}...
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/documents/${document.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Ouvrir
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDocumentSelect?.(document)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier rapidement
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(document.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Supprimer le document"
        description="Es-tu sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </>
  )
}

