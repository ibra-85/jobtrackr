/**
 * Validation et indicateur de force du mot de passe
 */

export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong"

export interface PasswordRequirements {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  special: boolean
}

export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-4
  requirements: PasswordRequirements
  allMet: boolean
}

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, key: "length" as const, label: "Au moins 8 caractères" },
  { regex: /[a-z]/, key: "lowercase" as const, label: "Au moins 1 lettre minuscule" },
  { regex: /[A-Z]/, key: "uppercase" as const, label: "Au moins 1 lettre majuscule" },
  { regex: /[0-9]/, key: "number" as const, label: "Au moins 1 chiffre" },
  { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, key: "special" as const, label: "Au moins 1 caractère spécial" },
] as const

/**
 * Calcule la force d'un mot de passe
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements: PasswordRequirements = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  }

  // Vérifier chaque critère
  PASSWORD_REQUIREMENTS.forEach((req) => {
    requirements[req.key] = req.regex.test(password)
  })

  // Calculer le score (0-4)
  const score = Object.values(requirements).filter(Boolean).length

  // Déterminer la force
  let strength: PasswordStrength = "weak"
  if (score === 0) {
    strength = "weak"
  } else if (score <= 2) {
    strength = "weak"
  } else if (score === 3) {
    strength = "medium"
  } else if (score === 4) {
    strength = "strong"
  } else if (score === 5) {
    strength = "very-strong"
  }

  return {
    strength,
    score,
    requirements,
    allMet: Object.values(requirements).every(Boolean),
  }
}

/**
 * Retourne la couleur pour la barre de force
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "bg-red-500"
    case "medium":
      return "bg-orange-500"
    case "strong":
      return "bg-yellow-500"
    case "very-strong":
      return "bg-green-500"
    default:
      return "bg-gray-300"
  }
}

/**
 * Retourne le label de force
 */
export function getPasswordStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Faible"
    case "medium":
      return "Moyen"
    case "strong":
      return "Fort"
    case "very-strong":
      return "Très fort"
    default:
      return ""
  }
}

