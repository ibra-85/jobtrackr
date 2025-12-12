/**
 * Système de cache simple en mémoire pour les données fréquemment accédées.
 * 
 * Note: Pour la production, considérer l'utilisation de Redis ou d'un autre
 * système de cache distribué.
 */

/**
 * Entrée de cache avec expiration
 */
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

/**
 * Cache simple en mémoire avec TTL (Time To Live)
 */
class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>()

  /**
   * Stocke une valeur dans le cache avec un TTL en millisecondes
   */
  set(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Retourne le nombre d'entrées dans le cache
   */
  size(): number {
    return this.cache.size
  }
}

/**
 * Cache global pour les job titles (TTL: 1 heure)
 */
export const jobTitlesCache = new SimpleCache<any[]>()

/**
 * Cache global pour les entreprises (TTL: 30 minutes)
 */
export const companiesCache = new SimpleCache<any[]>()

/**
 * Cache global pour les statistiques (TTL: 5 minutes)
 */
export const statsCache = new SimpleCache<any>()

/**
 * Nettoie périodiquement les caches expirés (à appeler dans un setInterval)
 */
export function startCacheCleanup(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    jobTitlesCache.cleanup()
    companiesCache.cleanup()
    statsCache.cleanup()
  }, intervalMs)
}

