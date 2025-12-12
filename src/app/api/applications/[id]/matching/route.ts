import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { documentsRepository } from "@/db/repositories/documents.repository"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { z } from "zod"

/**
 * POST /api/applications/[id]/matching
 * Calcule le score de matching entre une candidature et le profil utilisateur
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Récupérer la candidature
    const application = await applicationsRepository.getByIdWithCompany(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 }
      )
    }

    // Récupérer le CV principal de l'utilisateur
    const documents = await documentsRepository.getAllByUserId(session.user.id)
    const mainCV = documents.find((doc) => doc.type === "cv")

    if (!mainCV) {
      return NextResponse.json({
        data: {
          score: null,
          message: "Aucun CV trouvé. Ajoute un CV pour calculer le score de matching.",
          analysis: null,
          gaps: [],
        },
      })
    }

    // Préparer le contexte pour l'IA
    const jobContext = `
Poste : ${application.title}
${application.company?.name ? `Entreprise : ${application.company.name}` : ""}
${application.location ? `Localisation : ${application.location}` : ""}
${application.salaryRange ? `Fourchette salariale : ${application.salaryRange}` : ""}
${application.notes ? `Description : ${application.notes.substring(0, 1000)}` : ""}
${application.jobUrl ? `Offre : ${application.jobUrl}` : ""}
`.trim()

    // Utiliser Ollama pour analyser le matching
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    const { text } = await generateText({
      model,
      prompt: `Tu es un expert en recrutement. Analyse la compatibilité entre un CV et une offre d'emploi.

CV du candidat :
${mainCV.content.substring(0, 3000)}

Offre d'emploi :
${jobContext}

Calcule un score de compatibilité entre 0 et 100 et fournis une analyse détaillée.
Réponds en JSON avec ce format exact :
{
  "score": 75,
  "analysis": "Analyse détaillée de la compatibilité (2-3 phrases)",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "gaps": ["Compétence manquante 1", "Point à améliorer 2"],
  "recommendations": ["Recommandation 1", "Recommandation 2"]
}

IMPORTANT :
- Le score doit être entre 0 et 100
- Analyse doit être concis et professionnel
- Strengths : liste des points forts (max 5)
- Gaps : liste des compétences/expériences manquantes (max 5)
- Recommendations : suggestions pour améliorer le CV ou la candidature (max 3)`,
    })

    // Parser la réponse JSON
    let matchingResult
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        matchingResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Pas de JSON trouvé dans la réponse")
      }

      // Validation du score
      if (typeof matchingResult.score !== "number" || matchingResult.score < 0 || matchingResult.score > 100) {
        matchingResult.score = Math.max(0, Math.min(100, matchingResult.score || 50))
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError)
      // Fallback vers un score neutre
      matchingResult = {
        score: 50,
        analysis: "Impossible d'analyser la compatibilité automatiquement.",
        strengths: [],
        gaps: [],
        recommendations: [],
      }
    }

    return NextResponse.json({
      data: matchingResult,
    })
  } catch (error) {
    console.error("Erreur lors du calcul du matching:", error)
    // Si Ollama n'est pas disponible, retourner un score null
    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          data: {
            score: null,
            message: "Ollama n'est pas accessible. Assurez-vous qu'Ollama est démarré localement.",
            analysis: null,
            gaps: [],
          },
        },
        { status: 200 }
      )
    }
    return handleApiError(error)
  }
}

