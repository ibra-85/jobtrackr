"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Lightbulb, Mail, Calendar } from "lucide-react"
import { toast } from "sonner"
import { AISuggestionsCard } from "./ai-suggestions-card"

interface AISuggestionsButtonProps {
  applicationId: string
}

export function AISuggestionsButton({ applicationId }: AISuggestionsButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Sparkles className="h-4 w-4 mr-2" />
        Suggestions IA
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Suggestions IA
            </DialogTitle>
            <DialogDescription>
              Recommandations personnalisées pour cette candidature
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AISuggestionsCard applicationId={applicationId} embedded />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

