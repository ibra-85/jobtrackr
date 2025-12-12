import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { activitiesRepository } from "@/db/repositories/activities.repository"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { getLastInteraction, getDaysSinceLastInteraction } from "@/lib/applications-utils"

/**
 * POST /api/applications/[id]/ai-suggestions
 * Génère des suggestions IA personnalisées pour une candidature
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params

    // Récupérer la candidature avec l'entreprise
    const application = await applicationsRepository.getByIdWithCompany(id, session.user.id)
    if (!application) {
      return NextResponse.json(
        { error: "Candidature non trouvée" },
        { status: 404 }
      )
    }

    // Récupérer les activités
    const activities = await activitiesRepository.getByApplicationId(id, session.user.id)

    // Récupérer l'entreprise si elle existe
    const company = application.company
      ? await companiesRepository.getById(application.company.id)
      : null

    // Calculer les métriques
    const lastInteraction = getLastInteraction(activities)
    const daysSinceLastInteraction = getDaysSinceLastInteraction(activities)
    const now = new Date()
    const daysUntilDeadline = application.deadline
      ? Math.floor((new Date(application.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Utiliser Ollama pour générer des suggestions intelligentes
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    const context = `
Candidature :
- Titre du poste : ${application.title}
- Entreprise : ${company?.name || "Non spécifiée"}
- Statut : ${application.status === "pending" ? "En attente" : application.status === "in_progress" ? "En cours" : application.status === "accepted" ? "Acceptée" : "Refusée"}
- Date de candidature : ${application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("fr-FR") : "Non spécifiée"}
- Date limite : ${application.deadline ? new Date(application.deadline).toLocaleDateString("fr-FR") : "Aucune"}
- Dernière interaction : ${lastInteraction ? `${daysSinceLastInteraction} jour${daysSinceLastInteraction !== null && daysSinceLastInteraction > 1 ? "s" : ""} (${lastInteraction.description})` : "Aucune"}
- Jours jusqu'à deadline : ${daysUntilDeadline !== null ? daysUntilDeadline : "N/A"}
${application.location ? `- Localisation : ${application.location}` : ""}
${application.salaryRange ? `- Salaire : ${application.salaryRange}` : ""}
${application.notes ? `- Notes : ${application.notes.substring(0, 300)}` : ""}
${company?.sector ? `- Secteur entreprise : ${company.sector}` : ""}
`

    const { text } = await generateText({
      model,
      prompt: `Tu es un assistant carrière expert qui aide les candidats à optimiser leur recherche d'emploi.

Contexte de la candidature :
${context}

Génère des suggestions d'actions personnalisées et concrètes pour cette candidature. Réponds en JSON avec ce format exact :
{
  "nextAction": {
    "title": "Titre de l'action recommandée",
    "description": "Description détaillée de pourquoi cette action est importante",
    "urgency": "high" | "medium" | "low",
    "suggestedDate": "Date suggérée pour cette action (format: YYYY-MM-DD ou null)"
  },
  "tips": [
    "Conseil pratique 1",
    "Conseil pratique 2",
    "Conseil pratique 3"
  ],
  "emailDraft": "Texte suggéré pour un email de relance/suivi (si applicable, sinon null)"
}

IMPORTANT :
- Adapte les suggestions selon le statut, les dates, et le contexte
- Si deadline approche (< 3 jours), urgence = "high"
- Si pas de nouvelle depuis > 7 jours (pending) ou > 5 jours (in_progress), suggère une relance
- Si candidature jamais envoyée (pas de appliedAt), suggère de l'envoyer
- Les tips doivent être pratiques et actionnables
- L'emailDraft doit être professionnel, concis (max 150 mots), et adapté au contexte`,
    })

    // Parser la réponse JSON
    let suggestions
    try {
      // Extraire le JSON de la réponse (peut contenir du markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("Pas de JSON trouvé dans la réponse")
      }
    } catch (parseError) {
      console.error("Erreur parsing JSON:", parseError)
      // Fallback vers des suggestions basiques
      suggestions = {
        nextAction: {
          title: "Suivre la candidature",
          description: "Vérifier régulièrement l'état de cette candidature",
          urgency: "medium" as const,
          suggestedDate: null,
        },
        tips: [
          "Vérifier régulièrement l'état de la candidature",
          "Préparer des questions pour un éventuel entretien",
        ],
        emailDraft: null,
      }
    }

    return NextResponse.json({
      data: suggestions,
    })
  } catch (error) {
    console.error("Erreur lors de la génération des suggestions IA:", error)
    // Si Ollama n'est pas disponible, retourner des suggestions basiques
    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          data: {
            nextAction: {
              title: "Suivre la candidature",
              description: "Vérifier régulièrement l'état de cette candidature",
              urgency: "medium" as const,
              suggestedDate: null,
            },
            tips: [
              "Vérifier régulièrement l'état de la candidature",
            ],
            emailDraft: null,
          },
        },
        { status: 200 }
      )
    }
    return handleApiError(error)
  }
}

