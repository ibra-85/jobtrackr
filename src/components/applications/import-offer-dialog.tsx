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
import { Label } from "@/components/ui/label"
import { FileText, Sparkles } from "lucide-react"
import { parseOfferText, cleanOfferText, type ParsedOffer } from "@/lib/offer-parser"
import { toast } from "sonner"

interface ImportOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (parsedOffer: ParsedOffer) => void
}

export function ImportOfferDialog({ open, onOpenChange, onImport }: ImportOfferDialogProps) {
  const [text, setText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parsedOffer, setParsedOffer] = useState<ParsedOffer | null>(null)

  const handleParse = () => {
    if (!text.trim()) {
      toast.error("Veuillez coller une offre d'emploi")
      return
    }

    setParsing(true)
    try {
      const cleaned = cleanOfferText(text)
      const parsed = parseOfferText(cleaned)
      setParsedOffer(parsed)
      toast.success("Offre analysée avec succès")
    } catch (error) {
      console.error("Erreur lors du parsing:", error)
      toast.error("Erreur lors de l'analyse de l'offre")
    } finally {
      setParsing(false)
    }
  }

  const handleImport = () => {
    if (!parsedOffer) {
      toast.error("Veuillez d'abord analyser l'offre")
      return
    }
    onImport(parsedOffer)
    handleClose()
  }

  const handleClose = () => {
    setText("")
    setParsedOffer(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importer une offre d'emploi
          </DialogTitle>
          <DialogDescription>
            Collez le texte d'une offre d'emploi et nous allons extraire automatiquement les
            informations principales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="offer-text">Texte de l'offre</Label>
            <Textarea
              id="offer-text"
              placeholder="Collez ici le texte complet de l'offre d'emploi..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={parsing}
            />
            <p className="text-xs text-muted-foreground">
              Plus le texte est complet, meilleure sera l'extraction des informations.
            </p>
          </div>

          <Button
            onClick={handleParse}
            disabled={!text.trim() || parsing}
            className="w-full"
            variant="outline"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {parsing ? "Analyse en cours..." : "Analyser l'offre"}
          </Button>

          {parsedOffer && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold text-sm">Informations extraites :</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {parsedOffer.title && (
                  <div>
                    <span className="text-muted-foreground">Titre :</span>
                    <p className="font-medium">{parsedOffer.title}</p>
                  </div>
                )}
                {parsedOffer.company && (
                  <div>
                    <span className="text-muted-foreground">Entreprise :</span>
                    <p className="font-medium">{parsedOffer.company}</p>
                  </div>
                )}
                {parsedOffer.location && (
                  <div>
                    <span className="text-muted-foreground">Localisation :</span>
                    <p className="font-medium">{parsedOffer.location}</p>
                  </div>
                )}
                {parsedOffer.contractType && (
                  <div>
                    <span className="text-muted-foreground">Type de contrat :</span>
                    <p className="font-medium">{parsedOffer.contractType}</p>
                  </div>
                )}
                {parsedOffer.salaryRange && (
                  <div>
                    <span className="text-muted-foreground">Salaire :</span>
                    <p className="font-medium">{parsedOffer.salaryRange}</p>
                  </div>
                )}
                {parsedOffer.source && (
                  <div>
                    <span className="text-muted-foreground">Source :</span>
                    <p className="font-medium">{parsedOffer.source}</p>
                  </div>
                )}
                {parsedOffer.jobUrl && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">URL :</span>
                    <p className="font-medium break-all">{parsedOffer.jobUrl}</p>
                  </div>
                )}
              </div>
              {parsedOffer.description && (
                <div>
                  <span className="text-muted-foreground text-sm">Description :</span>
                  <p className="text-sm mt-1 line-clamp-3">{parsedOffer.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={parsing}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={!parsedOffer || parsing}>
            Importer dans le formulaire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

