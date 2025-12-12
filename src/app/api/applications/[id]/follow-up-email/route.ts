import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { applicationsRepository } from "@/db/repositories/applications.repository"
import { companiesRepository } from "@/db/repositories/companies.repository"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"

/**
 * POST /api/applications/[id]/follow-up-email
 * Génère un email de relance avec l'IA pour une candidature
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

    // Récupérer l'entreprise si elle existe
    const company = application.company
      ? await companiesRepository.getById(application.company.id)
      : null

    // Utiliser Ollama pour générer l'email de relance
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    // Construire le contexte pour l'IA
    const context = `
Candidature :
- Titre du poste : ${application.title}
- Entreprise : ${company?.name || application.title}
- Date de candidature : ${application.appliedAt ? new Date(application.appliedAt).toLocaleDateString("fr-FR") : "Non spécifiée"}
- Statut actuel : ${application.status === "pending" ? "En attente" : application.status === "in_progress" ? "En cours" : application.status === "accepted" ? "Acceptée" : "Refusée"}
- Dernière interaction : ${application.appliedAt ? `Il y a ${Math.floor((Date.now() - new Date(application.appliedAt).getTime()) / (1000 * 60 * 60 * 24))} jours` : "Non spécifiée"}
${application.location ? `- Localisation : ${application.location}` : ""}
${application.jobUrl ? `- Lien de l'offre : ${application.jobUrl}` : ""}
${application.notes ? `- Notes : ${application.notes.substring(0, 500)}` : ""}
`

    const { text } = await generateText({
      model,
      prompt: `Tu es un assistant qui aide à rédiger des emails professionnels de relance pour des candidatures d'emploi.

Contexte de la candidature :
${context}

Génère un email de relance professionnel, courtois et concis (maximum 200 mots) qui :
1. Rappelle poliment la candidature (titre du poste et entreprise)
2. Exprime l'intérêt continu pour le poste
3. Demande poliment des nouvelles sur le processus de recrutement
4. Reste professionnel et positif
5. Se termine par une formule de politesse appropriée

Format de l'email :
- Objet : Sujet professionnel et concis
- Corps : Email complet avec salutation, corps du message et formule de politesse

IMPORTANT : 
- L'email doit être en français
- Ton professionnel mais chaleureux
- Maximum 200 mots pour le corps du message
- Ne pas être trop insistant ou pressant
- Adapter le ton selon le temps écoulé depuis la candidature`,
    })

    // Parser la réponse pour extraire l'objet et le corps
    const lines = text.split("\n")
    let subject = ""
    let body = ""
    let inBody = false

    for (const line of lines) {
      if (line.toLowerCase().startsWith("objet:") || line.toLowerCase().startsWith("sujet:")) {
        subject = line.replace(/^(objet|sujet):\s*/i, "").trim()
      } else if (line.toLowerCase().startsWith("corps:") || inBody) {
        inBody = true
        if (!line.toLowerCase().startsWith("corps:")) {
          body += line + "\n"
        }
      } else if (!subject && line.trim().length > 0) {
        // Si pas d'objet explicite, prendre la première ligne significative
        if (!inBody) {
          subject = line.trim()
          inBody = true
        } else {
          body += line + "\n"
        }
      }
    }

    // Si pas d'objet trouvé, en générer un par défaut
    if (!subject) {
      subject = `Relance - Candidature ${application.title}`
    }

    // Nettoyer le corps
    body = body.trim()

    return NextResponse.json({
      data: {
        subject,
        body,
        fullText: text,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la génération de l'email de relance:", error)
    // Si Ollama n'est pas disponible, retourner une erreur explicite
    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error:
            "Ollama n'est pas accessible. Assurez-vous qu'Ollama est démarré localement (http://localhost:11434)",
        },
        { status: 503 }
      )
    }
    return handleApiError(error)
  }
}

