/**
 * Validation stricte des adresses email
 * Empêche la création d'utilisateurs avec des emails invalides
 */

/**
 * Regex stricte pour valider les emails (RFC 5322 compatible)
 * Vérifie :
 * - Format de base : local@domain
 * - Domain doit avoir au moins un point
 * - Domain doit avoir une extension valide (2+ caractères)
 * - Pas d'espaces
 * - Caractères autorisés uniquement
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

/**
 * Valide une adresse email
 * @param email - L'adresse email à valider
 * @returns true si l'email est valide, false sinon
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false
  }

  const trimmedEmail = email.trim().toLowerCase()

  // Vérification de base : non vide
  if (trimmedEmail.length === 0) {
    return false
  }

  // Vérification de longueur (RFC 5321)
  if (trimmedEmail.length > 254) {
    return false
  }

  // Vérification du format avec regex
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return false
  }

  // Vérification que le domaine a bien une extension (au moins 2 caractères après le dernier point)
  const parts = trimmedEmail.split("@")
  if (parts.length !== 2) {
    return false
  }

  const domain = parts[1]
  const domainParts = domain.split(".")

  // Doit avoir au moins 2 parties (ex: "example.com")
  if (domainParts.length < 2) {
    return false
  }

  // La dernière partie (extension) doit faire au moins 2 caractères
  const extension = domainParts[domainParts.length - 1]
  if (extension.length < 2) {
    return false
  }

  return true
}

/**
 * Retourne un message d'erreur pour un email invalide
 */
export function getEmailValidationError(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return "L'adresse email est requise."
  }

  if (email.length > 254) {
    return "L'adresse email est trop longue (maximum 254 caractères)."
  }

  if (!isValidEmail(email)) {
    return "L'adresse email n'est pas valide. Veuillez vérifier votre saisie (ex: nom@exemple.com)."
  }

  return null
}