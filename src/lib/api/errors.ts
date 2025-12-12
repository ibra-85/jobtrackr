/**
 * Classes d'erreur personnalisées pour les API routes.
 * Permet une gestion d'erreur typée et cohérente.
 */

/**
 * Classe de base pour les erreurs API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
    // Maintient la stack trace pour le debugging
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Erreur 401 - Non authentifié
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "Non authentifié") {
    super(message, 401, "UNAUTHORIZED")
    this.name = "UnauthorizedError"
  }
}

/**
 * Erreur 403 - Accès refusé
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Accès refusé") {
    super(message, 403, "FORBIDDEN")
    this.name = "ForbiddenError"
  }
}

/**
 * Erreur 404 - Ressource non trouvée
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = "Ressource") {
    super(`${resource} non trouvé(e)`, 404, "NOT_FOUND")
    this.name = "NotFoundError"
  }
}

/**
 * Erreur 400 - Requête invalide
 */
export class BadRequestError extends ApiError {
  constructor(message: string = "Requête invalide") {
    super(message, 400, "BAD_REQUEST")
    this.name = "BadRequestError"
  }
}

/**
 * Erreur 409 - Conflit (ex: ressource déjà existante)
 */
export class ConflictError extends ApiError {
  constructor(message: string = "Conflit") {
    super(message, 409, "CONFLICT")
    this.name = "ConflictError"
  }
}

/**
 * Erreur 422 - Entité non traitable (validation échouée)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = "Validation échouée",
    public details?: unknown
  ) {
    super(message, 422, "VALIDATION_ERROR")
    this.name = "ValidationError"
  }
}

