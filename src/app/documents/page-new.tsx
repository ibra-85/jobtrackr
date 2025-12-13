"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileBadge, 
  Plus, 
  Search, 
  Grid3X3, 
  List,
  Filter,
  Download,
  FileText,
  FileCode,
} from "lucide-react"
import { DocumentCard } from "@/components/documents/document-card"
import { DocumentCreateDialog } from "@/components/documents/document-create-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useRouter } from "next/navigation"
import type { Document, DocumentType } from "@/db/schema"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DocumentsPageNew() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "cv" | "cover_letter">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchQuery, activeTab])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
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

  const filterDocuments = () => {
    let filtered = documents

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter((doc) => doc.type === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleOpen = (document: Document) => {
    router.push(`/documents/${document.id}`)
  }

  const handleEdit = (document: Document) => {
    router.push(`/documents/${document.id}`)
  }

  const handleDelete = (document: Document) => {
    setDocumentToDelete(document)
    setConfirmDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await fetch(`/api/documents/${documentToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Document supprimé avec succès")
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id))
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

  const handleDownload = async (document: Document) => {
    try {
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
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du téléchargement")
    }
  }

  const handleDuplicate = async (document: Document) => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: document.type,
          title: `${document.title} (copie)`,
          content: document.content,
          format: document.format,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la duplication")
      }

      toast.success("Document dupliqué avec succès")
      fetchDocuments()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la duplication")
    }
  }

  const handleViewVersions = (document: Document) => {
    // TODO: Implement versions view
    toast.info("Fonctionnalité à venir")
  }

  const stats = {
    total: documents.length,
    cv: documents.filter((d) => d.type === "cv").length,
    letters: documents.filter((d) => d.type === "cover_letter").length,
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileBadge className="h-8 w-8" />
              Mes Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              {stats.total} document{stats.total > 1 ? "s" : ""} • {stats.cv} CV • {stats.letters} lettre{stats.letters > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau document
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Plus récents</DropdownMenuItem>
                <DropdownMenuItem>Plus anciens</DropdownMenuItem>
                <DropdownMenuItem>Titre (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Titre (Z-A)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">
              Tous ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="cv" className="gap-2">
              <FileText className="h-4 w-4" />
              CV ({stats.cv})
            </TabsTrigger>
            <TabsTrigger value="cover_letter" className="gap-2">
              <FileCode className="h-4 w-4" />
              Lettres ({stats.letters})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={FileBadge}
                title={searchQuery ? "Aucun document trouvé" : "Aucun document"}
                description={
                  searchQuery
                    ? "Essaie avec d'autres mots-clés"
                    : "Crée ton premier document pour commencer"
                }
                action={
                  !searchQuery ? (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un document
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {filteredDocuments.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    onOpen={handleOpen}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onDuplicate={handleDuplicate}
                    onViewVersions={handleViewVersions}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <DocumentCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchDocuments}
        />

        <ConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          title="Supprimer le document"
          description={`Es-tu sûr de vouloir supprimer "${documentToDelete?.title}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </AppShell>
  )
}

