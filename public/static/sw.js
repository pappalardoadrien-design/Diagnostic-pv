// Service Worker - DiagPV Mode Terrain PWA
// Cache Strategy: Network First with offline fallback

const CACHE_NAME = 'diagpv-v1'
const OFFLINE_URL = '/mobile/field'

// Fichiers à mettre en cache au premier chargement
const PRECACHE_ASSETS = [
  '/',
  '/mobile/field',
  '/crm/dashboard',
  '/static/module-nav.js',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js'
]

// Install: Mise en cache des assets essentiels
self.addEventListener('install', (event) => {
  console.log('[SW] Install')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })))
        .catch(err => {
          console.warn('[SW] Some assets failed to cache:', err)
          // Continue même si certains fichiers échouent
        })
    })
  )
  self.skipWaiting()
})

// Activate: Nettoyage anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch: Stratégie Network First avec fallback cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les URLs externes (sauf CDN)
  if (event.request.method !== 'GET') return
  
  const url = new URL(event.request.url)
  
  // Strategy pour les APIs: Network Only (pas de cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // En cas d'erreur réseau, retourner une réponse JSON vide
          return new Response(JSON.stringify({ error: 'offline', message: 'Mode hors ligne' }), {
            headers: { 'Content-Type': 'application/json' }
          })
        })
    )
    return
  }
  
  // Strategy pour les pages et assets: Network First
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone()
        
        // Mettre en cache si c'est une bonne réponse
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        
        return response
      })
      .catch(() => {
        // Fallback sur le cache si offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Si pas en cache et c'est une page HTML, retourner la page offline
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match(OFFLINE_URL)
          }
          
          // Sinon retourner une réponse par défaut
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
        })
      })
  )
})

// Background Sync: Synchroniser les données offline quand la connexion revient
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag)
  
  if (event.tag === 'sync-observations') {
    event.waitUntil(syncOfflineObservations())
  } else if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos())
  }
})

// Helper IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diagpv-db', 1)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('uploadQueue')) {
        db.createObjectStore('uploadQueue', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function syncPhotos() {
  try {
    const db = await openDB()
    const tx = db.transaction('uploadQueue', 'readonly')
    const store = tx.objectStore('uploadQueue')
    const request = store.getAll()
    
    const photos = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    if (photos.length === 0) return true
    
    console.log(`[SW] Syncing ${photos.length} photos...`)
    
    for (const photo of photos) {
      try {
        // Re-créer FormData ou JSON body
        // Note: photo.data contient les données brutes
        
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(photo.data)
        })
        
        if (response.ok) {
          // Supprimer de la queue
          const delTx = db.transaction('uploadQueue', 'readwrite')
          delTx.objectStore('uploadQueue').delete(photo.id)
          console.log(`[SW] Photo ${photo.id} synced`)
        }
      } catch (err) {
        console.error(`[SW] Failed to sync photo ${photo.id}`, err)
      }
    }
    
    return true
  } catch (error) {
    console.error('[SW] Sync photos failed:', error)
    throw error
  }
}

async function syncOfflineObservations() {
  try {
    // Récupérer les observations stockées localement
    // Cette partie sera gérée par le code client
    console.log('[SW] Syncing offline observations...')
    return true
  } catch (error) {
    console.error('[SW] Sync failed:', error)
    throw error // Re-throw pour retry automatique
  }
}

// Push Notifications (pour futures évolutions)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'DiagPV'
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/static/icon-192.png',
    badge: '/static/icon-192.png',
    data: data.url || '/'
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data)
  )
})

console.log('[SW] Service Worker loaded')
