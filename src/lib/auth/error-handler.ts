/**
 * Helper pour traduire les erreurs d'authentification en messages utilisateur-friendly
 */

export function getAuthErrorMessage(error: unknown): string {
  if (!error) {
    return "Une erreur est survenue. Veuillez réessayer."
  }

  // Si c'est une instance d'Error avec un message
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Messages d'erreur Better Auth courants
    if (message.includes("invalid") && (message.includes("credentials") || message.includes("login"))) {
      return "Email ou mot de passe incorrect."
    }

    if (message.includes("email") && message.includes("invalid")) {
      return "L'adresse email n'est pas valide. Veuillez vérifier votre saisie."
    }

    if (message.includes("password") && (message.includes("short") || message.includes("6"))) {
      return "Le mot de passe doit contenir au moins 6 caractères."
    }

    if (message.includes("already") && (message.includes("registered") || message.includes("exists"))) {
      return "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email."
    }

    if (message.includes("rate limit") || message.includes("too many")) {
      return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer."
    }

    // Retourner le message d'erreur original si disponible
    return error.message
  }

  // Si c'est un objet avec une propriété message
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }

  // Message générique par défaut
  return "Une erreur est survenue. Veuillez réessayer."
}

