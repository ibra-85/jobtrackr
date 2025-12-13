import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { NotFoundError } from "@/lib/api/errors"
import { documentsRepository } from "@/db/repositories/documents.repository"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { z } from "zod"

/**
 * POST /api/documents/[id]/analyze
 * Analyse un CV avec l'IA et fournit un score + recommandations
 */

const CVAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  overall: z.string().min(1),
  strengths: z.array(z.string()).max(5),
  weaknesses: z.array(z.string()).max(5),
  recommendations: z
    .array(
      z.object({
        category: z.enum(["Structure", "Contenu", "Format", "Mots-clés", "Autre"]),
        priority: z.enum(["high", "medium", "low"]),
        suggestion: z.string().min(1),
      })
    )
    .max(8),
  missingSections: z.array(z.string()),
  keywords: z.array(z.string()),
})

type CVAnalysis = z.infer<typeof CVAnalysisSchema>

function fallbackAnalysis(): CVAnalysis {
  return {
    score: 50,
    overall: "Impossible d'analyser automatiquement le CV.",
    strengths: [],
    weaknesses: [],
    recommendations: [],
    missingSections: [],
    keywords: [],
  }
}

/**
 * Essaie de parser du JSON de manière robuste :
 * 1) JSON direct
 * 2) bloc ```json ... ```
 * 3) premier objet JSON équilibré via brace-matching
 */
function extractJsonCandidate(raw: string): unknown {
  // 1) Try direct JSON
  try {
    return JSON.parse(raw)
  } catch {
    // noop
  }

  // 2) Try fenced ```json ... ```
  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i)
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1])
    } catch {
      // noop
    }
  }

  // 3) Brace matching: first balanced {...}
  const start = raw.indexOf("{")
  if (start === -1) {
    throw new Error("Pas de JSON trouvé (aucun '{').")
  }

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]

    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === "\\") {
        escape = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === "{") depth++
    if (ch === "}") depth--

    if (depth === 0) {
      const candidate = raw.slice(start, i + 1)
      return JSON.parse(candidate)
    }
  }

  throw new Error("JSON non équilibré (accolades).")
}

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

    // IMPORTANT: prompt plus strict -> JSON uniquement
    const prompt = `Tu es un expert en recrutement et en rédaction de CV.

Analyse le CV ci-dessous et réponds UNIQUEMENT avec un objet JSON valide.
AUCUN texte hors JSON. Pas de markdown. Pas d'explications.

CV :
${document.content.substring(0, 5000)}

Le JSON doit suivre exactement cette structure :
{
  "score": 75,
  "overall": "Analyse globale du CV (2-3 phrases)",
  "strengths": ["Point fort 1"],
  "weaknesses": ["Point faible 1"],
  "recommendations": [
    {
      "category": "Structure",
      "priority": "high",
      "suggestion": "Recommandation détaillée"
    }
  ],
  "missingSections": ["Section manquante 1"],
  "keywords": ["Mot-clé 1"]
}

Contraintes :
- score: 0 à 100
- strengths: max 5
- weaknesses: max 5
- recommendations: max 8
- category ∈ Structure|Contenu|Format|Mots-clés|Autre
- priority ∈ high|medium|low
`

    const { text } = await generateText({
      model,
      prompt,
    })

    let analysis: CVAnalysis

    try {
      const candidate = extractJsonCandidate(text)
      const validated = CVAnalysisSchema.safeParse(candidate)

      if (!validated.success) {
        console.error("Analyse CV: JSON invalide (Zod):", validated.error.flatten())
        analysis = fallbackAnalysis()
      } else {
        analysis = validated.data
      }
    } catch (parseError) {
      console.error("Analyse CV: erreur parsing JSON:", parseError)
      analysis = fallbackAnalysis()
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
