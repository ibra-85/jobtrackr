"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Loader2, CheckCircle2, XCircle, AlertTriangle, TrendingUp } from "lucide-react"
import { toast } from "sonner"

interface MatchingResult {
  score: number | null
  analysis?: string | null
  strengths?: string[]
  gaps?: string[]
  recommendations?: string[]
  message?: string
}

interface MatchingScoreCardProps {
  applicationId: string
}

export function MatchingScoreCard({ applicationId }: MatchingScoreCardProps) {
  const [matching, setMatching] = useState<MatchingResult | null>(null)
  const [loading, setLoading] = useState(false)

  const loadMatching = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}/matching`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement du matching")
      }

      const result = await response.json()
      setMatching(result.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Impossible de calculer le score de matching")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground"
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    if (score >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBadgeVariant = (score: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (score === null) return "outline"
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getScoreLabel = (score: number | null) => {
    if (score === null) return "N/A"
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Bon"
    if (score >= 40) return "Moyen"
    return "Faible"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score de compatibilité
            </CardTitle>
            <CardDescription>
              Analyse de la compatibilité entre ton profil et cette offre
            </CardDescription>
          </div>
          {!matching?.score && (
            <Button onClick={loadMatching} disabled={loading} size="sm" variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Calculer
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {matching?.message ? (
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            {matching.message}
          </div>
        </CardContent>
      ) : matching?.score !== null && matching?.score !== undefined ? (
        <CardContent className="space-y-4">
          {/* Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de compatibilité</span>
              <Badge variant={getScoreBadgeVariant(matching.score)} className={getScoreColor(matching.score)}>
                {matching.score}/100 - {getScoreLabel(matching.score)}
              </Badge>
            </div>
            <Progress value={matching.score} className="h-2" />
          </div>

          {/* Analysis */}
          {matching.analysis && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">{matching.analysis}</p>
            </div>
          )}

          {/* Strengths */}
          {matching.strengths && matching.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Points forts
              </h4>
              <ul className="space-y-1">
                {matching.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps */}
          {matching.gaps && matching.gaps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Points à améliorer
              </h4>
              <ul className="space-y-1">
                {matching.gaps.map((gap, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {matching.recommendations && matching.recommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Recommandations
              </h4>
              <ul className="space-y-1">
                {matching.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={loadMatching} disabled={loading} variant="outline" size="sm" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recalcul...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Recalculer le score
              </>
            )}
          </Button>
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-center py-8">
            <Button onClick={loadMatching} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calcul...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Calculer le score de compatibilité
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

