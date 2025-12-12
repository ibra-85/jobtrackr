"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Sparkles, Plus, FileBadge } from "lucide-react"
import { DocumentList } from "@/components/documents/document-list"
import { DocumentDialog } from "@/components/documents/document-dialog"
import { DocumentGenerateDialog } from "@/components/documents/document-generate-dialog"
import type { Document, DocumentType } from "@/db/schema"

export default function DocumentsPage() {
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedType, setSelectedType] = useState<DocumentType | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<"all" | "cv" | "letters">("all")
  const [generatedContent, setGeneratedContent] = useState<{ title: string; content: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreate = (type: DocumentType) => {
    setSelectedType(type)
    setSelectedDocument(null)
    setDocumentDialogOpen(true)
  }

  const handleGenerate = (type: DocumentType) => {
    setSelectedType(type)
    setGenerateDialogOpen(true)
  }

  const handleEdit = (document: Document) => {
    setSelectedDocument(document)
    setSelectedType(undefined)
    setDocumentDialogOpen(true)
  }

  const handleGenerated = (title: string, content: string) => {
    setGeneratedContent({ title, content })
    setSelectedDocument(null)
    setDocumentDialogOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileBadge className="h-8 w-8" />
              CV & Lettres
            </h1>
            <p className="text-muted-foreground mt-1">
              Gère tes CV et lettres de motivation, générés avec l&apos;IA
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                CV
              </CardTitle>
              <CardDescription>Gère tes CV professionnels</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={() => handleGenerate("cv")}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec IA
              </Button>
              <Button
                onClick={() => handleCreate("cv")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer manuellement
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lettres de motivation
              </CardTitle>
              <CardDescription>Gère tes lettres de motivation</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                onClick={() => handleGenerate("cover_letter")}
                variant="outline"
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer avec IA
              </Button>
              <Button
                onClick={() => handleCreate("cover_letter")}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer manuellement
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="cv">CV</TabsTrigger>
            <TabsTrigger value="letters">Lettres</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <DocumentList onDocumentSelect={handleEdit} refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="cv" className="mt-6">
            <DocumentList type="cv" onDocumentSelect={handleEdit} refreshKey={refreshKey} />
          </TabsContent>
          <TabsContent value="letters" className="mt-6">
            <DocumentList type="cover_letter" onDocumentSelect={handleEdit} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <DocumentDialog
          open={documentDialogOpen}
          onOpenChange={(open) => {
            setDocumentDialogOpen(open)
            if (!open) {
              setSelectedDocument(null)
              setSelectedType(undefined)
              setGeneratedContent(null)
            }
          }}
          document={selectedDocument}
          type={selectedType}
          initialContent={generatedContent}
          onSuccess={() => {
            setGeneratedContent(null)
            setRefreshKey((prev) => prev + 1)
          }}
        />

        <DocumentGenerateDialog
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
          type={selectedType || "cv"}
          onGenerated={(title, content) => {
            // Ouvrir le dialog avec le contenu généré
            handleGenerated(title, content)
            // Note: On devrait passer le contenu généré au dialog
            // Pour l'instant, on peut utiliser un state global ou un callback
          }}
        />
      </div>
    </AppShell>
  )
}



