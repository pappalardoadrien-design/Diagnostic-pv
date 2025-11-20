import { Context, Next } from 'hono'
import type { KVNamespace } from '@cloudflare/workers-types'

// ============================================================================
// CLOUDFLARE KV CACHE MIDDLEWARE
// ============================================================================
// Middleware intelligent pour cache automatique des réponses API
// Supporte TTL configurable, invalidation sur mutations, namespaces
// ============================================================================

export interface CacheOptions {
  ttl?: number                    // Durée cache en secondes (défaut: 3600 = 1h)
  namespace?: string              // Préfixe clé (ex: "girasole:", "iv:")
  skipCache?: boolean             // Force bypass cache
  invalidateOnMutation?: boolean  // Invalide cache sur POST/PUT/DELETE (défaut: true)
  keyGenerator?: (c: Context) => string  // Générateur clé personnalisé
}

/**
 * Génère clé cache depuis URL + query params
 */
function generateCacheKey(c: Context, namespace: string = ''): string {
  const url = new URL(c.req.url)
  const path = url.pathname
  const params = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  
  const key = params ? `${path}?${params}` : path
  return namespace ? `${namespace}${key}` : key
}

/**
 * Middleware cache KV pour routes GET
 * 
 * Usage:
 * ```typescript
 * app.get('/api/data', cache({ ttl: 1800, namespace: 'api:' }), async (c) => {
 *   return c.json({ data: await fetchData() })
 * })
 * ```
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 3600,
    namespace = '',
    skipCache = false,
    invalidateOnMutation = true,
    keyGenerator
  } = options

  return async (c: Context, next: Next) => {
    const KV = c.env.KV as KVNamespace
    
    // Skip cache si désactivé ou si mutation (POST/PUT/DELETE/PATCH)
    const method = c.req.method
    if (skipCache || (invalidateOnMutation && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method))) {
      await next()
      return
    }
    
    // Génération clé cache
    const cacheKey = keyGenerator ? keyGenerator(c) : generateCacheKey(c, namespace)
    
    try {
      // Tentative lecture cache
      if (method === 'GET') {
        const cached = await KV.get(cacheKey, 'json')
        if (cached) {
          console.log(`[Cache HIT] ${cacheKey}`)
          // Ajouter header X-Cache-Status
          c.header('X-Cache-Status', 'HIT')
          c.header('X-Cache-Key', cacheKey)
          return c.json(cached)
        }
        console.log(`[Cache MISS] ${cacheKey}`)
      }
      
      // Exécution handler
      await next()
      
      // Stockage en cache si GET et réponse 200
      if (method === 'GET' && c.res.status === 200) {
        try {
          const responseClone = c.res.clone()
          const data = await responseClone.json()
          
          await KV.put(cacheKey, JSON.stringify(data), {
            expirationTtl: ttl
          })
          
          console.log(`[Cache SET] ${cacheKey} (TTL: ${ttl}s)`)
          c.header('X-Cache-Status', 'MISS')
          c.header('X-Cache-Key', cacheKey)
        } catch (error) {
          console.error('[Cache] Error storing response:', error)
        }
      }
      
    } catch (error) {
      console.error('[Cache] Error:', error)
      await next()
    }
  }
}

/**
 * Invalide cache pour une route spécifique
 */
export async function invalidateCache(
  KV: KVNamespace,
  path: string,
  namespace: string = ''
): Promise<void> {
  const key = namespace ? `${namespace}${path}` : path
  await KV.delete(key)
  console.log(`[Cache INVALIDATE] ${key}`)
}

/**
 * Invalide tous les caches d'un namespace
 * Note: KV ne supporte pas list() complet, on stocke liste clés séparément
 */
export async function invalidateNamespace(
  KV: KVNamespace,
  namespace: string
): Promise<void> {
  const keysListKey = `__keys:${namespace}`
  const keysList = await KV.get(keysListKey, 'json') as string[] | null
  
  if (keysList && Array.isArray(keysList)) {
    await Promise.all(
      keysList.map(key => KV.delete(key))
    )
    await KV.delete(keysListKey)
    console.log(`[Cache INVALIDATE NAMESPACE] ${namespace} (${keysList.length} keys)`)
  }
}

/**
 * Middleware invalidation automatique sur mutations
 * À placer APRÈS cache() middleware
 */
export function cacheInvalidator(namespace: string = '') {
  return async (c: Context, next: Next) => {
    const method = c.req.method
    
    // Si mutation, invalider cache après exécution
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      await next()
      
      // Invalider cache de la route parente
      const KV = c.env.KV as KVNamespace
      const url = new URL(c.req.url)
      const basePath = url.pathname.split('/').slice(0, -1).join('/')
      
      try {
        await invalidateCache(KV, basePath, namespace)
        await invalidateCache(KV, url.pathname, namespace)
      } catch (error) {
        console.error('[Cache Invalidator] Error:', error)
      }
    } else {
      await next()
    }
  }
}

/**
 * Helper: Création clé cache custom
 */
export function createCacheKey(parts: string[], namespace: string = ''): string {
  const key = parts.filter(Boolean).join(':')
  return namespace ? `${namespace}${key}` : key
}

/**
 * Helper: Stockage manuel en cache
 */
export async function setCache(
  KV: KVNamespace,
  key: string,
  data: any,
  ttl: number = 3600,
  namespace: string = ''
): Promise<void> {
  const cacheKey = namespace ? `${namespace}${key}` : key
  await KV.put(cacheKey, JSON.stringify(data), { expirationTtl: ttl })
  console.log(`[Cache SET MANUAL] ${cacheKey} (TTL: ${ttl}s)`)
}

/**
 * Helper: Lecture manuelle du cache
 */
export async function getCache<T = any>(
  KV: KVNamespace,
  key: string,
  namespace: string = ''
): Promise<T | null> {
  const cacheKey = namespace ? `${namespace}${key}` : key
  const data = await KV.get(cacheKey, 'json')
  if (data) {
    console.log(`[Cache GET MANUAL HIT] ${cacheKey}`)
  } else {
    console.log(`[Cache GET MANUAL MISS] ${cacheKey}`)
  }
  return data as T | null
}
