import { NextRequest, NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join } from "path"

interface JobTitle {
  code_ogr: number
  libelle: string
  libelle_court: string
  transition_eco?: string
  transition_num?: string | null
  transition_demo?: string | null
  emploi_reglemente?: string | null
  emploi_cadre?: string | null
  classification: string
  origine: string
  code_rome_parent: string
  peu_usite: string
}

interface JobTitleFormatted {
  label: string
  shortLabel: string
  code: number
  codeRome: string
}

// Cache en mémoire pour éviter de relire le fichier à chaque requête
let cachedJobTitles: JobTitleFormatted[] | null = null
let cacheTimestamp: number = 0
let fileModificationTime: number = 0
const CACHE_DURATION = 1000 * 60 * 60 // 1 heure

/**
 * Charge le fichier JSON et le met en cache
 */
async function loadJobTitles(): Promise<JobTitleFormatted[]> {
  const filePath = join(process.cwd(), "data", "job-titles.json")

  try {
    // Vérifier la date de modification du fichier
    const stats = await stat(filePath)
    const currentModTime = stats.mtimeMs

    // Si le cache est valide et le fichier n'a pas changé, retourner le cache
    if (
      cachedJobTitles &&
      Date.now() - cacheTimestamp < CACHE_DURATION &&
      currentModTime === fileModificationTime
    ) {
      return cachedJobTitles
    }

    // Lire le fichier JSON
    let fileContent: string
    try {
      // Essayer d'abord en UTF-8
      fileContent = await readFile(filePath, "utf-8")

      // Si le fichier contient des caractères mal encodés, essayer d'autres encodages
      if (fileContent.includes("\uFFFD")) {
        const buffer = await readFile(filePath)
        const encodings = ["latin1", "windows-1252", "iso-8859-1", "cp1252"]
        for (const encoding of encodings) {
          try {
            const testContent = buffer.toString(encoding as BufferEncoding)
            const badCharCount = (testContent.match(/\uFFFD/g) || []).length
            const currentBadCharCount = (fileContent.match(/\uFFFD/g) || []).length
            if (badCharCount < currentBadCharCount) {
              fileContent = testContent
              console.log(`Fichier lu avec l'encodage: ${encoding}`)
              break
            }
          } catch {
            continue
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error)
      throw error
    }

    // Parser le JSON
    let jobTitles: JobTitle[]
    try {
      jobTitles = JSON.parse(fileContent)
    } catch (error) {
      console.error("Erreur lors du parsing du JSON:", error)
      throw new Error("Erreur lors de la lecture du fichier JSON")
    }

    // Formater et filtrer les données (exclure les peu usités)
    const formatted = jobTitles
      .filter((job) => job.peu_usite !== "O")
      .map((job) => ({
        label: job.libelle,
        shortLabel: job.libelle_court,
        code: job.code_ogr,
        codeRome: job.code_rome_parent,
      }))

    // Mettre en cache
    cachedJobTitles = formatted
    cacheTimestamp = Date.now()
    fileModificationTime = currentModTime

    console.log(`✅ ${formatted.length} postes chargés et mis en cache`)

    return formatted
  } catch (error) {
    console.error("Erreur lors du chargement des postes:", error)
    // Retourner le cache si disponible même s'il est expiré
    if (cachedJobTitles) {
      console.warn("Utilisation du cache expiré en cas d'erreur")
      return cachedJobTitles
    }
    throw error
  }
}

/**
 * GET /api/job-titles
 * Récupère les suggestions de postes avec recherche optionnelle
 * 
 * Query params:
 * - q: terme de recherche (optionnel)
 * - limit: nombre maximum de résultats (défaut: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.toLowerCase().trim() || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200) // Max 200

    // Charger les données (avec cache)
    let jobTitles: JobTitleFormatted[]
    try {
      jobTitles = await loadJobTitles()
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      return NextResponse.json(
        { error: "Impossible de charger les postes" },
        { status: 500 }
      )
    }

    // Si pas de recherche, retourner les premiers résultats
    if (!query) {
      return NextResponse.json(jobTitles.slice(0, limit))
    }

    // Normaliser la query : enlever les accents et normaliser les séparateurs
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .replace(/[\/\-\s]+/g, " ") // Remplacer /, - et espaces multiples par un espace
        .trim()
    }

    const normalizedQuery = normalizeText(query)
    const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0)
    
    // Type temporaire avec score pour le tri
    interface JobTitleWithScore extends JobTitleFormatted {
      score: number
    }
    
    const results: JobTitleWithScore[] = []

    for (const job of jobTitles) {
      // Normaliser les libellés (enlever /, accents, etc.)
      const normalizedLabel = normalizeText(job.label)
      const normalizedShortLabel = normalizeText(job.shortLabel)

      // Score de correspondance (plus élevé = meilleure correspondance)
      let score = 0

      // 1. Recherche exacte (priorité maximale)
      if (normalizedLabel === normalizedQuery || normalizedShortLabel === normalizedQuery) {
        score = 100
      }
      // 2. Commence par la query (très haute priorité)
      else if (
        normalizedLabel.startsWith(normalizedQuery + " ") ||
        normalizedShortLabel.startsWith(normalizedQuery + " ") ||
        normalizedLabel.startsWith(normalizedQuery) ||
        normalizedShortLabel.startsWith(normalizedQuery)
      ) {
        score = 90
      }
      // 3. Contient la query complète comme phrase (haute priorité)
      else if (normalizedLabel.includes(" " + normalizedQuery + " ") || 
               normalizedShortLabel.includes(" " + normalizedQuery + " ") ||
               normalizedLabel.includes(normalizedQuery) || 
               normalizedShortLabel.includes(normalizedQuery)) {
        score = 80
      }
      // 4. Tous les mots sont présents (moyenne priorité)
      else if (queryWords.length > 0) {
        // Vérifier si tous les mots de la recherche sont présents dans le libellé
        const allWordsMatch = queryWords.every(
          (word) => normalizedLabel.includes(word) || normalizedShortLabel.includes(word)
        )
        
        if (allWordsMatch) {
          // Calculer un score basé sur le nombre de mots correspondants
          const matchingWords = queryWords.filter(
            (word) => normalizedLabel.includes(word) || normalizedShortLabel.includes(word)
          ).length
          
          // Bonus si les mots sont dans l'ordre (même séparés par d'autres mots)
          let orderBonus = 0
          if (queryWords.length > 1) {
            // Vérifier si on peut trouver les mots dans l'ordre dans le texte
            let lastIndex = -1
            let wordsInOrder = true
            for (const word of queryWords) {
              const index = Math.max(
                normalizedLabel.indexOf(word, lastIndex + 1),
                normalizedShortLabel.indexOf(word, lastIndex + 1)
              )
              if (index === -1 || index < lastIndex) {
                wordsInOrder = false
                break
              }
              lastIndex = index
            }
            if (wordsInOrder) {
              orderBonus = 15
            }
          }
          
          score = 50 + (matchingWords / queryWords.length) * 30 + orderBonus
        }
      }

      if (score > 0) {
        results.push({ ...job, score })
      }
    }

    // Trier par score décroissant puis par label alphabétique
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return a.label.localeCompare(b.label)
    })

    // Retirer le score avant de retourner
    const finalResults: JobTitleFormatted[] = results
      .slice(0, limit)
      .map(({ score, ...job }) => job)

    // Log pour debug (uniquement en développement)
    if (process.env.NODE_ENV === "development" && query) {
      console.log(`Recherche: "${query}" → ${finalResults.length} résultats`)
      if (finalResults.length > 0) {
        console.log(`Premier résultat: "${finalResults[0].label}"`)
      }
    }

    return NextResponse.json(finalResults)
  } catch (error) {
    console.error("Erreur lors de la récupération des postes:", error)
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des postes" },
      { status: 500 }
    )
  }
}

