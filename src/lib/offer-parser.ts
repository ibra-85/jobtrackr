/**
 * Utilitaires pour parser les offres d'emploi depuis du texte brut
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
 * Parse une offre d'emploi depuis du texte brut
 * Extrait les informations principales : titre, entreprise, localisation, etc.
 */
export function parseOfferText(text: string): ParsedOffer {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0)
  const result: ParsedOffer = {}

  // Recherche du titre (généralement dans les premières lignes, souvent en gras ou en majuscules)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]
    // Si la ligne est courte (< 100 caractères) et contient des mots-clés de poste
    if (line.length < 100 && !result.title) {
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
        "consultant",
        "analyst",
        "product",
        "marketing",
        "sales",
        "recruteur",
        "recruiter",
      ]
      const lowerLine = line.toLowerCase()
      if (jobKeywords.some((keyword) => lowerLine.includes(keyword))) {
        result.title = line
        break
      }
    }
  }

  // Si pas de titre trouvé, prendre la première ligne significative
  if (!result.title && lines.length > 0) {
    const firstLine = lines[0]
    if (firstLine.length < 150 && !firstLine.includes("@") && !firstLine.includes("http")) {
      result.title = firstLine
    }
  }

  // Recherche de l'entreprise (souvent après le titre ou contient "chez", "at", etc.)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].toLowerCase()
    if (
      line.includes("chez") ||
      line.includes("at ") ||
      line.includes("entreprise") ||
      line.includes("company") ||
      line.includes("société")
    ) {
      // Extraire le nom de l'entreprise
      const match = lines[i].match(/(?:chez|at|entreprise|company|société)[\s:]+(.+)/i)
      if (match && match[1]) {
        result.company = match[1].trim()
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

