"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Lightbulb, Mail, Calendar } from "lucide-react"
import { toast } from "sonner"

interface AISuggestions {
  nextAction: {
    title: string
    description: string
    urgency: "high" | "medium" | "low"
    suggestedDate: string | null
  }
  tips: string[]
  emailDraft: string | null
}

interface AISuggestionsCardProps {
  applicationId: string
  embedded?: boolean // Si true, pas de Card wrapper (pour Dialog)
}

export function AISuggestionsCard({ applicationId, embedded = false }: AISuggestionsCardProps) {
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [showEmailDraft, setShowEmailDraft] = useState(false)

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/ai-suggestions`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des suggestions")
      }

      const result = await response.json()
      setSuggestions(result.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Impossible de charger les suggestions IA")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyEmail = async () => {
    if (!suggestions?.emailDraft) return
    await navigator.clipboard.writeText(suggestions.emailDraft)
    toast.success("Email copié dans le presse-papiers")
  }

  const urgencyColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const

  const urgencyLabels = {
    high: "Urgent",
    medium: "Moyen",
    low: "Faible",
  } as const

  const content = (
    <>
      {!embedded && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Suggestions IA
              </CardTitle>
              <CardDescription>
                Recommandations personnalisées pour cette candidature
              </CardDescription>
            </div>
            {!suggestions && (
              <Button onClick={loadSuggestions} disabled={loading} size="sm" variant="outline">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyser avec IA
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      {!suggestions && (
        <CardContent>
          <div className="text-center py-8">
            <Button onClick={loadSuggestions} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser avec IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
      {suggestions && (
        <CardContent className="space-y-4">
          {/* Prochaine action */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">Prochaine action recommandée</h4>
                  <Badge variant={urgencyColors[suggestions.nextAction.urgency]}>
                    {urgencyLabels[suggestions.nextAction.urgency]}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {suggestions.nextAction.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {suggestions.nextAction.description}
                </p>
                {suggestions.nextAction.suggestedDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Date suggérée :{" "}
                    {new Date(suggestions.nextAction.suggestedDate).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conseils */}
          {suggestions.tips.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Conseils pratiques
              </h4>
              <ul className="space-y-1.5">
                {suggestions.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Email draft */}
          {suggestions.emailDraft && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email de relance suggéré
                </h4>
                <Button
                  onClick={() => setShowEmailDraft(!showEmailDraft)}
                  variant="ghost"
                  size="sm"
                >
                  {showEmailDraft ? "Masquer" : "Afficher"}
                </Button>
              </div>
              {showEmailDraft && (
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg border text-sm font-mono whitespace-pre-wrap">
                    {suggestions.emailDraft}
                  </div>
                  <Button onClick={handleCopyEmail} variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Copier l'email
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button onClick={loadSuggestions} disabled={loading} variant="outline" size="sm" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regénération...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Regénérer les suggestions
              </>
            )}
          </Button>
        </CardContent>
      )}
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return <Card>{content}</Card>
}

