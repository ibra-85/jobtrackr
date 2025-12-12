import { NextRequest, NextResponse } from "next/server"
import { requireAuth, handleApiError } from "@/lib/api/helpers"
import { validateRequest } from "@/lib/validation/helpers"
import { z } from "zod"
import { generateObject } from "ai"
import { ollama } from "ollama-ai-provider-v2"

const ParseOfferSchema = z.object({
  text: z.string().min(50, "Le texte doit contenir au moins 50 caractères"),
})

/**
 * POST /api/offers/parse-ai
 * Parse une offre d'emploi avec l'IA (Ollama)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)
    const body = await request.json()

    // Valider les données avec Zod
    const validation = validateRequest(ParseOfferSchema, body)
    if (!validation.success) {
      return validation.error
    }

    const { text } = validation.data

    // Utiliser Ollama pour parser l'offre
    // Modèle recommandé : llama3.2, phi3, mistral, ou qwen2.5
    // Vous pouvez changer le modèle selon ce que vous avez installé localement
    const modelName = process.env.OLLAMA_MODEL || "llama3.2"
    const model = ollama(modelName)

    const { object } = await generateObject({
      model,
      schema: z.object({
        title: z
          .string()
          .optional()
          .describe(
            "Titre du poste (OBLIGATOIRE si présent dans le texte). Cherche dans les premières lignes, souvent en gras ou majuscules. Exemples: 'Développeur Full Stack', 'Ingénieur DevOps', 'Product Manager'. Ne confonds pas avec le nom de l'entreprise."
          ),
        company: z
          .string()
          .optional()
          .describe(
            "Nom de l'entreprise qui recrute (OBLIGATOIRE si présent). Cherche après le titre, peut être précédé de 'chez', 'at', 'Entreprise:'. Cherche aussi dans les URLs. Ne confonds pas avec le titre du poste."
          ),
        location: z
          .string()
          .optional()
          .describe("Localisation (ville, région, 'Remote' si télétravail complet, 'Hybride' si mixte)"),
        contractType: z
          .enum(["cdi", "cdd", "stage", "alternance", "freelance"])
          .optional()
          .describe("Type de contrat (cdi, cdd, stage, alternance, ou freelance)"),
        salaryRange: z.string().optional().describe("Fourchette salariale si mentionnée (ex: '45k€-60k€', '50 000€/an')"),
        jobUrl: z.string().url().optional().describe("URL de l'offre si présente dans le texte"),
        source: z
          .enum([
            "linkedin",
            "indeed",
            "welcome_to_the_jungle",
            "apec",
            "francetravail",
            "monster",
            "glassdoor",
            "site_carriere",
            "autre",
          ])
          .optional()
          .describe("Source de l'offre détectée depuis l'URL ou le contexte"),
        description: z.string().optional().describe("Description/résumé de l'offre (2-3 phrases)"),
        summary: z
          .string()
          .optional()
          .describe(
            "Résumé structuré de l'offre en 3-5 bullet points. Chaque point doit être sur une nouvelle ligne avec un tiret. Mettre en évidence : stack technique, expérience requise, localisation/remote, salaire (si présent), avantages clés."
          ),
      }),
      prompt: `Tu es un expert en extraction d'informations d'offres d'emploi. Analyse ce texte et extrais TOUTES les informations disponibles, en particulier le TITRE DU POSTE et le NOM DE L'ENTREPRISE qui sont les informations les plus importantes.

Texte de l'offre :
${text.substring(0, 5000)} 

INSTRUCTIONS IMPORTANTES :

1. TITRE DU POSTE (OBLIGATOIRE si présent) :
   - Cherche dans les premières lignes du texte (souvent en gras, en majuscules, ou mis en évidence)
   - Peut être précédé de mots comme "Poste :", "Recherche :", "Nous recherchons", "Offre :"
   - Exemples : "Développeur Full Stack", "Ingénieur DevOps", "Product Manager", "Designer UX/UI"
   - Si le titre n'est pas explicite, déduis-le du contexte (description du poste, compétences requises)
   - Ne prends PAS l'entreprise comme titre, ni la localisation

2. NOM DE L'ENTREPRISE (OBLIGATOIRE si présent) :
   - Cherche après le titre, souvent sur la même ligne ou la ligne suivante
   - Peut être précédé de : "chez", "at", "Entreprise :", "Company :", "Société :"
   - Peut être dans l'en-tête, le pied de page, ou la signature de l'email
   - Cherche aussi dans les URLs (ex: linkedin.com/company/nom-entreprise)
   - Si plusieurs entreprises sont mentionnées, prends celle qui recrute (pas les partenaires)
   - Ne confonds PAS avec le titre du poste

3. LOCALISATION :
   - Indique "Remote" si télétravail complet, "Hybride" si mixte, ou la ville/région si mentionnée
   - Exemples : "Paris", "Lyon", "Remote", "Hybride (Paris)", "Île-de-France"

4. TYPE DE CONTRAT :
   - Utilise uniquement : cdi, cdd, stage, alternance, ou freelance
   - Si non mentionné, laisse vide

5. FOURCHETTE SALARIALE :
   - Extrais si mentionnée (ex: "45k€-60k€", "50 000€/an")

6. URL DE L'OFFRE :
   - Extrais toutes les URLs présentes dans le texte

7. SOURCE :
   - Détecte depuis l'URL ou le contexte : linkedin, indeed, welcome_to_the_jungle, apec, francetravail, monster, glassdoor, site_carriere, ou autre

8. DESCRIPTION :
   - Résume la description du poste en 2-3 phrases si disponible

9. RÉSUMÉ STRUCTURÉ (SUMMARY) :
   - Crée un résumé en 3-5 bullet points (une ligne par point avec un tiret "-")
   - Mettre en évidence les éléments critiques :
     * Stack technique principale (ex: "React, TypeScript, Node.js")
     * Expérience requise (ex: "3-5 ans d'expérience en développement")
     * Localisation et mode de travail (ex: "Remote complet ou hybride Paris")
     * Fourchette salariale si mentionnée (ex: "45k€-60k€/an")
     * Avantages clés ou points forts de l'offre (ex: "Équipe internationale, projets innovants")
   - Format : Chaque point sur une nouvelle ligne avec un tiret "- " au début
   - Exemple :
     - Stack : React, TypeScript, Node.js
     - Expérience : 3-5 ans
     - Localisation : Remote ou hybride Paris
     - Salaire : 45k€-60k€/an
     - Avantages : Équipe internationale, projets innovants

IMPORTANT : Le titre et l'entreprise sont les informations les plus critiques. Analyse bien le texte pour les trouver, même s'ils ne sont pas explicitement formatés.`,
    })

    return NextResponse.json({
      data: object,
    })
  } catch (error) {
    console.error("Erreur lors du parsing IA:", error)
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

