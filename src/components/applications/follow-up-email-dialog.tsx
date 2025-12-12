"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Sparkles, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface FollowUpEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId: string
}

export function FollowUpEmailDialog({
  open,
  onOpenChange,
  applicationId,
}: FollowUpEmailDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/follow-up-email`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la génération")
      }

      const result = await response.json()
      setSubject(result.data.subject)
      setBody(result.data.body)
      toast.success("Email de relance généré avec succès")
    } catch (error) {
      console.error("Erreur lors de la génération:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la génération de l'email"
      toast.error(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    const fullEmail = `Objet: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(fullEmail)
    setCopied(true)
    toast.success("Email copié dans le presse-papiers")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setSubject("")
    setBody("")
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email de relance
          </DialogTitle>
          <DialogDescription>
            Génère un email de relance professionnel avec l'IA pour cette candidature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!subject && !body && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Cliquez sur le bouton ci-dessous pour générer un email de relance personnalisé avec
                l'IA.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "Génération en cours..." : "Générer l'email de relance"}
              </Button>
            </div>
          )}

          {(subject || body) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Objet</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet de l'email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">Corps de l'email</Label>
                <Textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Corps de l'email"
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGenerate} disabled={generating} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generating ? "Regénération..." : "Regénérer"}
                </Button>
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copier l'email
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
