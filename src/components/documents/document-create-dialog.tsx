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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  FileText, 
  Sparkles, 
  Loader2, 
  Wand2,
  FileCode,
  FileBadge,
} from "lucide-react"
import { toast } from "sonner"
import { MarkdownEditor } from "./markdown-editor"
import type { DocumentType, DocumentFormat } from "@/db/schema"

interface DocumentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DocumentCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: DocumentCreateDialogProps) {
  const [step, setStep] = useState<"type" | "method" | "manual" | "ai">("type")
  const [documentType, setDocumentType] = useState<DocumentType>("cv")
  const [format, setFormat] = useState<DocumentFormat>("markdown")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  
  // AI generation fields
  const [aiContext, setAiContext] = useState("")
  const [aiProfile, setAiProfile] = useState("")
  const [generating, setGenerating] = useState(false)
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      // Reset form
      setStep("type")
      setDocumentType("cv")
      setFormat("markdown")
      setTitle("")
      setContent("")
      setAiContext("")
      setAiProfile("")
    }
  }, [open])

  const handleGenerateWithAI = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: documentType,
          context: aiContext.trim() || undefined,
          userProfile: aiProfile.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la génération")
      }

      const result = await response.json()
      setTitle(result.data.title)
      setContent(result.data.content)
      toast.success("Document généré avec succès!")
      setStep("manual") // Show manual editor with generated content
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis")
      return
    }
    if (!content.trim()) {
      toast.error("Le contenu est requis")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: documentType,
          title: title.trim(),
          content: content.trim(),
          format,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la création")
      }

      toast.success("Document créé avec succès!")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Créer un nouveau document
          </DialogTitle>
          <DialogDescription>
            Crée un CV ou une lettre de motivation avec ou sans l&apos;aide de l&apos;IA
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Choose document type */}
        {step === "type" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de document</Label>
              <RadioGroup value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                <Card className={documentType === "cv" ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cv" id="type-cv" />
                      <Label htmlFor="type-cv" className="cursor-pointer flex-1 font-semibold">
                        CV (Curriculum Vitae)
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground">
                      Crée un CV professionnel pour présenter ton parcours, tes compétences et tes expériences.
                    </p>
                  </CardContent>
                </Card>

                <Card className={documentType === "cover_letter" ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cover_letter" id="type-letter" />
                      <Label htmlFor="type-letter" className="cursor-pointer flex-1 font-semibold">
                        Lettre de motivation
                      </Label>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground">
                      Rédige une lettre de motivation personnalisée pour accompagner ta candidature.
                    </p>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Format</Label>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as DocumentFormat)}>
                <div className="flex gap-4">
                  <Card className={`flex-1 cursor-pointer ${format === "markdown" ? "border-primary" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="markdown" id="format-md" />
                        <Label htmlFor="format-md" className="cursor-pointer flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          Markdown
                        </Label>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card className={`flex-1 cursor-pointer ${format === "plain_text" ? "border-primary" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="plain_text" id="format-text" />
                        <Label htmlFor="format-text" className="cursor-pointer flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Texte
                        </Label>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={() => setStep("method")}>
                Continuer
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Choose creation method */}
        {step === "method" && (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStep("ai")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Générer avec l&apos;IA
                  </CardTitle>
                  <CardDescription>
                    Laisse l&apos;IA créer un document professionnel basé sur ton profil et contexte
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStep("manual")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Créer manuellement
                  </CardTitle>
                  <CardDescription>
                    Rédige ton document toi-même avec l&apos;éditeur
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("type")}>
                Retour
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3a: AI Generation */}
        {step === "ai" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-context">
                {documentType === "cv" ? "Contexte professionnel" : "Contexte de candidature"}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="ai-context"
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder={
                  documentType === "cv"
                    ? "Ex: Développeur Full Stack, 5 ans d'expérience React/Node.js, expert TypeScript..."
                    : "Ex: Candidature pour le poste de Développeur React chez TechCorp, annonce LinkedIn..."
                }
                rows={4}
                disabled={generating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-profile">Profil détaillé (optionnel)</Label>
              <Textarea
                id="ai-profile"
                value={aiProfile}
                onChange={(e) => setAiProfile(e.target.value)}
                placeholder="Compétences techniques, expériences détaillées, formations, certifications..."
                rows={5}
                disabled={generating}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("method")} disabled={generating}>
                Retour
              </Button>
              <Button onClick={handleGenerateWithAI} disabled={generating || !aiContext.trim()}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3b: Manual Creation */}
        {step === "manual" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="document-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Ex: ${documentType === "cv" ? "Mon CV - Développeur" : "Lettre - Poste Développeur TechCorp"}`}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-content">
                Contenu <span className="text-destructive">*</span>
              </Label>
              {format === "markdown" ? (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  disabled={saving}
                  placeholder={`Écris ton ${documentType === "cv" ? "CV" : "lettre de motivation"} en Markdown...`}
                />
              ) : (
                <Textarea
                  id="document-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Écris ton ${documentType === "cv" ? "CV" : "lettre de motivation"}...`}
                  className="min-h-[500px] font-mono text-sm"
                  disabled={saving}
                />
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("method")} disabled={saving}>
                Retour
              </Button>
              <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Créer le document
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

