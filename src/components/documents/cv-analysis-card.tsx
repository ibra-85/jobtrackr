"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Loader2, CheckCircle2, AlertTriangle, Lightbulb, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface CVAnalysis {
  score: number
  overall: string
  strengths: string[]
  weaknesses: string[]
  recommendations: Array<{
    category: string
    priority: "high" | "medium" | "low"
    suggestion: string
  }>
  missingSections: string[]
  keywords: string[]
}

interface CVAnalysisCardProps {
  documentId: string
}

export function CVAnalysisCard({ documentId }: CVAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse")
      }

      const result = await response.json()
      setAnalysis(result.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Impossible d'analyser le CV")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    if (score >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Bon"
    if (score >= 40) return "Moyen"
    return "À améliorer"
  }

  const priorityColors = {
    high: "destructive",
    medium: "default",
    low: "secondary",
  } as const

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyse IA du CV
            </CardTitle>
            <CardDescription>
              Évaluation automatique et recommandations d&apos;amélioration
            </CardDescription>
          </div>
          {!analysis && (
            <Button onClick={loadAnalysis} disabled={loading} size="sm" variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {analysis ? (
        <CardContent className="space-y-4">
          {/* Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score global</span>
              <Badge variant={getScoreBadgeVariant(analysis.score)} className={getScoreColor(analysis.score)}>
                {analysis.score}/100 - {getScoreLabel(analysis.score)}
              </Badge>
            </div>
            <Progress value={analysis.score} className="h-2" />
          </div>

          {/* Overall */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">{analysis.overall}</p>
          </div>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                Points forts
              </h4>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Points à améliorer
              </h4>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Recommandations
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={priorityColors[rec.priority]} className="text-xs">
                        {rec.category}
                      </Badge>
                      {rec.priority === "high" && (
                        <Badge variant="destructive" className="text-xs">
                          Prioritaire
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Sections */}
          {analysis.missingSections && analysis.missingSections.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold">Sections manquantes</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missingSections.map((section, index) => (
                  <Badge key={index} variant="outline">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-sm font-semibold">Mots-clés présents</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button onClick={loadAnalysis} disabled={loading} variant="outline" size="sm" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reanalyse...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Réanalyser le CV
              </>
            )}
          </Button>
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-center py-8">
            <Button onClick={loadAnalysis} disabled={loading} variant="outline">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser le CV avec l&apos;IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

