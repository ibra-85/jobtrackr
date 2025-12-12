import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { documentsRepository } from "@/db/repositories/documents.repository"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"

/**
 * POST /api/documents/[id]/analyze
 * Analyse un CV avec l'IA et fournit un score + recommandations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Récupérer le document
    const document = await documentsRepository.getById(id, session.user.id)
    if (!document) {
      throw new NotFoundError("Document")
    }

    if (document.type !== "cv") {
      return NextResponse.json(
        { error: "L'analyse est uniquement disponible pour les CV" },
        { status: 400 }
      )
    }

    // Utiliser Ollama pour analyser le CV
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    const { text } = await generateText({
      model,
      prompt: `Tu es un expert en recrutement et en rédaction de CV. Analyse ce CV et fournis une évaluation détaillée.

CV à analyser :
${document.content.substring(0, 5000)}

Fournis une analyse complète en JSON avec ce format exact :
{
  "score": 75,
  "overall": "Analyse globale du CV (2-3 phrases)",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "weaknesses": ["Point faible 1", "Point faible 2"],
  "recommendations": [
    {
      "category": "Structure" | "Contenu" | "Format" | "Mots-clés" | "Autre",
      "priority": "high" | "medium" | "low",
      "suggestion": "Recommandation détaillée"
    }
  ],
  "missingSections": ["Section manquante 1", "Section manquante 2"],
  "keywords": ["Mot-clé important présent", "Autre mot-clé"]
}

IMPORTANT :
- Score entre 0 et 100 (évaluation globale de la qualité)
- Strengths : points forts (max 5)
- Weaknesses : points faibles à améliorer (max 5)
- Recommendations : suggestions pratiques et actionnables (max 8)
- MissingSections : sections généralement attendues mais absentes
- Keywords : mots-clés pertinents présents dans le CV`,
    })

    // Parser la réponse JSON
    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Pas de JSON trouvé dans la réponse")
      }

      // Validation du score
      if (typeof analysis.score !== "number" || analysis.score < 0 || analysis.score > 100) {
        analysis.score = Math.max(0, Math.min(100, analysis.score || 50))
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError)
      // Fallback vers une analyse basique
      analysis = {
        score: 50,
        overall: "Impossible d'analyser automatiquement le CV.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        missingSections: [],
        keywords: [],
      }
    }

    return NextResponse.json({
      data: analysis,
    })
  } catch (error) {
    console.error("Erreur lors de l'analyse du CV:", error)
    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error:
            "Ollama n'est pas accessible. Assurez-vous qu'Ollama est démarré localement.",
        },
        { status: 503 }
      )
    }
    return handleApiError(error)
  }
}

