"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Document } from "@/db/schema"
import { DocumentDialog } from "@/components/documents/document-dialog"
import { CVAnalysisCard } from "@/components/documents/cv-analysis-card"

const documentTypeLabels: Record<Document["type"], string> = {
  cv: "CV",
  cover_letter: "Lettre de motivation",
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchDocument()
  }, [id])

  const fetchDocument = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents/${id}`)
      if (response.ok) {
        const result = await response.json()
        setDocument(result.data)
      } else if (response.status === 404) {
        toast.error("Document non trouvé")
        router.push("/documents")
      } else {
        toast.error("Erreur lors du chargement du document")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement du document")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
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

  if (!document) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle>Document non trouvé</CardTitle>
            <CardDescription>
              Le document que tu recherches n&apos;existe pas ou tu n&apos;as pas les droits pour
              y accéder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux documents
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link href="/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
              <Badge variant="outline">{documentTypeLabels[document.type]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Créé le {formatDate(document.createdAt)} • Modifié le {formatDate(document.updatedAt)}
            </p>
          </div>
          <Button onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Document Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contenu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                    {document.content}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* CV Analysis */}
            {document.type === "cv" && (
              <CVAnalysisCard documentId={document.id} />
            )}
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
                  <div className="text-sm">{documentTypeLabels[document.type]}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Titre</div>
                  <div className="text-sm font-medium">{document.title}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Longueur</div>
                  <div className="text-sm">{document.content.length} caractères</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Créé le</div>
                  <div className="text-sm">{formatDate(document.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Modifié le</div>
                  <div className="text-sm">{formatDate(document.updatedAt)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <DocumentDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              fetchDocument()
            }
          }}
          document={document}
          onSuccess={() => {
            fetchDocument()
            toast.success("Document modifié avec succès")
          }}
        />
      </div>
    </AppShell>
  )
}

