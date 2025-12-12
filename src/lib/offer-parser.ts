/**
 * Utilitaires pour parser les offres d'emploi depuis du texte brut
 * Supporte deux modes : parsing classique (regex) et parsing IA (Ollama)
 */

export interface ParsedOffer {
  title?: string
  company?: string
  location?: string
  contractType?: string
  salaryRange?: string
  description?: string
  source?: string
  jobUrl?: string
}

/**
 * Parse une offre avec l'IA (Ollama)
 * @param text Texte de l'offre à parser
 * @returns Promise avec les informations parsées
 */
export async function parseOfferWithAI(text: string): Promise<ParsedOffer> {
  try {
    const response = await fetch("/api/offers/parse-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erreur lors du parsing IA")
    }

    const result = await response.json()
    return result.data || {}
  } catch (error) {
    console.error("Erreur parsing IA:", error)
    // Fallback vers le parsing classique en cas d'erreur
    return parseOfferText(text)
  }
}

/**
 * Parse une offre d'emploi depuis du texte brut
 * Extrait les informations principales : titre, entreprise, localisation, etc.
 */
export function parseOfferText(text: string): ParsedOffer {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)
  const result: ParsedOffer = {}

  // Recherche du titre (généralement dans les premières lignes, souvent en gras ou en majuscules)
  // Cherche d'abord avec des patterns explicites
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i]
    // Patterns explicites pour le titre
    const titlePatterns = [
      /(?:poste|titre|offre|recherche|nous recherchons|we are looking for)[\s:]+(.+)/i,
      /^(.+?)(?:\s*[-–—]\s*|$)/, // Ligne qui se termine par un tiret ou est seule
    ]
    
    for (const pattern of titlePatterns) {
      const match = line.match(pattern)
      if (match && match[1]) {
        const potentialTitle = match[1].trim()
        if (potentialTitle.length > 3 && potentialTitle.length < 150) {
          result.title = potentialTitle
          break
        }
      }
    }
    if (result.title) break
  }

  // Si pas trouvé avec patterns, chercher avec mots-clés de poste
  if (!result.title) {
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i]
      // Si la ligne est courte (< 120 caractères) et contient des mots-clés de poste
      if (line.length < 120 && !result.title) {
        const jobKeywords = [
          "développeur",
          "developer",
          "ingénieur",
          "engineer",
          "designer",
          "manager",
          "lead",
          "senior",
          "junior",
          "architect",
          "architecte",
          "consultant",
          "analyst",
          "analyste",
          "product",
          "marketing",
          "sales",
          "commercial",
          "recruteur",
          "recruiter",
          "chef de projet",
          "project manager",
          "data",
          "devops",
          "sre",
          "qa",
          "test",
          "scrum",
          "agile",
        ]
        const lowerLine = line.toLowerCase()
        if (jobKeywords.some((keyword) => lowerLine.includes(keyword))) {
          // Vérifier que ce n'est pas une URL ou un email
          if (!line.includes("@") && !line.includes("http") && !line.includes("www.")) {
            result.title = line
            break
          }
        }
      }
    }
  }

  // Si pas de titre trouvé, prendre la première ligne significative
  if (!result.title && lines.length > 0) {
    const firstLine = lines[0]
    if (
      firstLine.length < 150 &&
      firstLine.length > 5 &&
      !firstLine.includes("@") &&
      !firstLine.includes("http") &&
      !firstLine.includes("www.") &&
      !firstLine.match(/^\d+$/) // Pas un numéro seul
    ) {
      result.title = firstLine
    }
  }

  // Recherche de l'entreprise (souvent après le titre ou contient "chez", "at", etc.)
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()
    
    // Patterns explicites pour l'entreprise
    const companyPatterns = [
      /(?:chez|at|entreprise|company|société|firme|firm)[\s:]+(.+)/i,
      /(?:recrutement|recruiting|hiring)\s+(?:par|by|chez|at)\s+(.+)/i,
      /^(.+?)\s+(?:recrute|is hiring|hiring|seeking)/i,
    ]
    
    for (const pattern of companyPatterns) {
      const match = line.match(pattern)
      if (match && match[1]) {
        const potentialCompany = match[1].trim()
        // Filtrer les faux positifs
        if (
          potentialCompany.length > 2 &&
          potentialCompany.length < 100 &&
          !potentialCompany.includes("http") &&
          !potentialCompany.includes("@") &&
          !potentialCompany.match(/^\d+$/)
        ) {
          result.company = potentialCompany
          break
        }
      }
    }
    
    // Chercher aussi dans les URLs (ex: linkedin.com/company/nom-entreprise)
    const urlMatch = line.match(/linkedin\.com\/company\/([^\/\s]+)/i)
    if (urlMatch && urlMatch[1] && !result.company) {
      result.company = urlMatch[1]
        .replace(/-/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    }
    
    if (result.company) break
  }
  
  // Si toujours pas trouvé, chercher une ligne qui ressemble à un nom d'entreprise
  // (ligne courte, après le titre, pas d'URL, pas d'email)
  if (!result.company && result.title) {
    const titleIndex = lines.findIndex((line) => line === result.title)
    for (let i = titleIndex + 1; i < Math.min(titleIndex + 5, lines.length); i++) {
      const line = lines[i]
      if (
        line.length > 2 &&
        line.length < 80 &&
        !line.includes("http") &&
        !line.includes("@") &&
        !line.includes("www.") &&
        !line.match(/^\d+/) &&
        !line.toLowerCase().includes("poste") &&
        !line.toLowerCase().includes("offre") &&
        !line.toLowerCase().includes("localisation") &&
        !line.toLowerCase().includes("salaire")
      ) {
        result.company = line
        break
      }
    }
  }

  // Recherche de la localisation (contient souvent des mots-clés géographiques)
  const locationKeywords = [
    "paris",
    "lyon",
    "marseille",
    "toulouse",
    "nice",
    "nantes",
    "strasbourg",
    "montpellier",
    "bordeaux",
    "lille",
    "rennes",
    "reims",
    "france",
    "remote",
    "télétravail",
    "hybride",
    "sur site",
    "on site",
    "full remote",
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (locationKeywords.some((keyword) => line.includes(keyword))) {
      // Extraire la localisation
      const match = lines[i].match(/(?:localisation|location|lieu|ville|région)[\s:]+(.+)/i)
      if (match && match[1]) {
        result.location = match[1].trim()
      } else if (line.includes("remote") || line.includes("télétravail")) {
        result.location = "Remote"
      } else if (line.includes("hybride")) {
        result.location = "Hybride"
      } else {
        // Prendre la ligne complète si elle contient un mot-clé de localisation
        result.location = lines[i]
      }
      break
    }
  }

  // Recherche du type de contrat
  const contractPatterns = [
    { pattern: /(?:cdi|contrat à durée indéterminée)/i, value: "cdi" },
    { pattern: /(?:cdd|contrat à durée déterminée)/i, value: "cdd" },
    { pattern: /(?:stage|internship|intern)/i, value: "stage" },
    { pattern: /(?:alternance|apprentissage|apprenticeship)/i, value: "alternance" },
    { pattern: /(?:freelance|freelance|indépendant|independent)/i, value: "freelance" },
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { pattern, value } of contractPatterns) {
      if (pattern.test(line)) {
        result.contractType = value
        break
      }
    }
    if (result.contractType) break
  }

  // Recherche du salaire
  const salaryPatterns = [
    /(\d+[\s-]?\d*)\s*(?:€|euros?|EUR)\s*(?:par\s*(?:an|mois|année|month|year))?/i,
    /(?:salaire|salary|rémunération|remuneration)[\s:]+(\d+[\s-]?\d*)\s*(?:€|euros?|EUR)?/i,
    /(\d+[\s-]?\d*)\s*(?:€|euros?|EUR)\s*(?:-\s*\d+[\s-]?\d*)?\s*(?:€|euros?|EUR)?/i,
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const pattern of salaryPatterns) {
      const match = line.match(pattern)
      if (match) {
        result.salaryRange = match[0].trim()
        break
      }
    }
    if (result.salaryRange) break
  }

  // Recherche d'URL (lien vers l'offre)
  const urlPattern = /(https?:\/\/[^\s]+)/i
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(urlPattern)
    if (match) {
      result.jobUrl = match[1]
      // Détecter la source depuis l'URL
      const url = match[1].toLowerCase()
      if (url.includes("linkedin.com")) result.source = "linkedin"
      else if (url.includes("indeed.com") || url.includes("indeed.fr")) result.source = "indeed"
      else if (url.includes("welcometothejungle.com")) result.source = "welcome_to_the_jungle"
      else if (url.includes("site-carriere") || url.includes("careers")) result.source = "site_carriere"
      break
    }
  }

  // Description : prendre le reste du texte (limité à 2000 caractères)
  const descriptionStart = Math.max(
    lines.findIndex((line) => line.length > 50),
    0,
  )
  const descriptionText = lines.slice(descriptionStart).join("\n")
  if (descriptionText.length > 0) {
    result.description = descriptionText.substring(0, 2000)
  }

  return result
}

/**
 * Nettoie et normalise le texte d'une offre
 */
export function cleanOfferText(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Normaliser les retours à la ligne
    .replace(/\n{3,}/g, "\n\n") // Réduire les sauts de ligne multiples
    .trim()
}

