"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Save, 
  X, 
  FileText,
  Eye,
  Sparkles,
  History,
  Share2,
  Printer,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Document } from "@/db/schema"
import { MarkdownEditor } from "@/components/documents/markdown-editor"
import { Textarea } from "@/components/ui/textarea"
import { CVAnalysisCard } from "@/components/documents/cv-analysis-card"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const documentTypeLabels: Record<Document["type"], string> = {
  cv: "CV",
  cover_letter: "Lettre de motivation",
}

const formatLabels: Record<Document["format"], string> = {
  markdown: "Markdown",
  plain_text: "Texte",
  html: "HTML",
}

export default function DocumentDetailPageNew() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit state
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

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
        setEditTitle(result.data.title)
        setEditContent(result.data.content)
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

  const handleSave = async () => {
    if (!document) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      toast.success("Document sauvegardé avec succès")
      setEditing(false)
      fetchDocument()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (!document) return
    setEditTitle(document.title)
    setEditContent(document.content)
    setEditing(false)
  }

  const handleDownload = () => {
    if (!document) return
    
    const blob = new Blob([document.content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = `${document.title}.${document.format === "markdown" ? "md" : "txt"}`
    window.document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    window.document.body.removeChild(a)
    toast.success("Document téléchargé")
  }

  const handleExportPDF = async () => {
    if (!document) return
    
    try {
      const response = await fetch(`/api/documents/${document.id}/export?format=pdf`)
      if (!response.ok) {
        throw new Error("Erreur lors de l'export")
      }
      
      const html = await response.text()
      const blob = new Blob([html], { type: "text/html" })
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
      toast.success("Document exporté (imprimer pour PDF)")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de l'export PDF")
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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link href="/documents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold h-auto py-2"
                disabled={saving}
              />
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
                <Badge variant="outline">{documentTypeLabels[document.type]}</Badge>
                <Badge variant="secondary">{formatLabels[document.format]}</Badge>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Créé le {formatDate(document.createdAt)} • Modifié le {formatDate(document.updatedAt)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-pulse" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleExportPDF}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Document Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editing ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  {editing ? "Édition" : "Contenu"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  document.format === "markdown" ? (
                    <MarkdownEditor
                      value={editContent}
                      onChange={setEditContent}
                      disabled={saving}
                    />
                  ) : (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[600px] font-mono text-sm"
                      disabled={saving}
                    />
                  )
                ) : (
                  <div>
                    {document.format === "markdown" ? (
                      <article className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {document.content}
                        </ReactMarkdown>
                      </article>
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg">
                        {document.content}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CV Analysis */}
            {document.type === "cv" && !editing && (
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
                  <div className="text-sm font-medium text-muted-foreground mb-1">Format</div>
                  <div className="text-sm">{formatLabels[document.format]}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Longueur</div>
                  <div className="text-sm">{document.content.length} caractères</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Mots</div>
                  <div className="text-sm">
                    {document.content.split(/\s+/).filter(Boolean).length} mots
                  </div>
                </div>
              </CardContent>
            </Card>

            {!editing && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleExportPDF}>
                    <Printer className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <History className="h-4 w-4 mr-2" />
                    Versions (bientôt)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager (bientôt)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

