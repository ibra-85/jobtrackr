import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { z } from "zod"

const GenerateDocumentSchema = z.object({
  type: z.enum(["cv", "cover_letter"]),
  title: z.string().optional(),
  context: z.string().optional(), // Contexte optionnel (ex: pour une lettre, le poste visé)
  userProfile: z.string().optional(), // Profil utilisateur optionnel
})

/**
 * POST /api/documents/generate
 * Génère un CV ou une lettre de motivation avec l'IA
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = GenerateDocumentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, title, context, userProfile } = validation.data

    // Utiliser Ollama pour générer le document
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    const documentTypeLabel = type === "cv" ? "CV" : "lettre de motivation"
    const promptContext = context || "général"
    const profileInfo = userProfile ? `\n\nProfil du candidat :\n${userProfile}` : ""

    const prompt = type === "cv"
      ? `Génère un CV professionnel complet et structuré en français.

Contexte : ${promptContext}${profileInfo}

Structure attendue :
- En-tête avec nom, coordonnées (email, téléphone, localisation, LinkedIn si disponible)
- Profil professionnel / Résumé (3-4 lignes)
- Compétences techniques et professionnelles
- Expériences professionnelles (avec dates, poste, entreprise, missions/points clés)
- Formations (diplômes, certifications)
- Langues
- Centres d'intérêt (optionnel)

IMPORTANT :
- Utilise un format professionnel et moderne
- Structure avec des sections claires
- Sois concis mais informatif
- Adapte le contenu au contexte fourni
- Génère un CV complet et prêt à être utilisé`

      : `Génère une lettre de motivation professionnelle en français.

Contexte : ${promptContext}${profileInfo}

La lettre doit :
- Être adressée de manière professionnelle (Monsieur/Madame le Recruteur, ou nom si fourni)
- Commencer par une accroche pertinente
- Mettre en valeur les compétences et expériences du candidat
- Montrer la motivation et l'adéquation au poste
- Être structurée (paragraphes clairs)
- Se terminer par une formule de politesse et une signature

IMPORTANT :
- Utilise un ton professionnel mais chaleureux
- Adapte le contenu au contexte du poste/entreprise
- Longueur appropriée (1 page environ)
- Génère une lettre complète et prête à être utilisée`

    const { text: generatedContent } = await generateText({
      model,
      prompt,
    })

    const defaultTitle = type === "cv"
      ? "Mon CV"
      : `Lettre de motivation - ${context || "Candidature"}`

    return NextResponse.json({
      data: {
        type,
        title: title || defaultTitle,
        content: generatedContent,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la génération du document:", error)
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

