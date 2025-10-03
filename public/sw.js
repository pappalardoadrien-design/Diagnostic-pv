// DiagPV Audit EL - Service Worker pour mode offline
// Cache intelligent pour usage terrain sans réseau

const CACHE_NAME = 'diagpv-audit-v1.0.0'
const OFFLINE_URL = '/offline.html'

// Ressources critiques à mettre en cache
const CRITICAL_RESOURCES = [
  '/',
  '/static/diagpv-styles.css',
  '/static/diagpv-app.js',
  '/static/diagpv-audit.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
]

// Installation SW
self.addEventListener('install', event => {
  console.log('🔧 DiagPV SW Installation')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Mise en cache ressources critiques')
        return cache.addAll(CRITICAL_RESOURCES)
      })
      .then(() => self.skipWaiting())
  )
})

// Activation SW
self.addEventListener('activate', event => {
  console.log('✅ DiagPV SW Activé')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Suppression ancien cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Interception requêtes
self.addEventListener('fetch', event => {
  const { request } = event
  
  // Stratégies selon type de requête
  if (request.url.includes('/api/')) {
    // API: Network First (avec fallback cache pour GET)
    event.respondWith(networkFirstStrategy(request))
  } else if (request.destination === 'document') {
    // Pages HTML: Cache First avec network fallback
    event.respondWith(cacheFirstStrategy(request))
  } else {
    // Ressources statiques: Cache First
    event.respondWith(cacheFirstStrategy(request))
  }
})

// Stratégie Network First pour API
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful API responses (GET only)
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('📡 Network failed, trying cache:', request.url)
    
    // Fallback cache pour GET API
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Fallback offline pour audits
    if (request.url.includes('/audit/')) {
      return generateOfflineAuditPage(request)
    }
    
    throw error
  }
}

// Stratégie Cache First 
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Mise à jour en arrière-plan si possible
    updateCacheInBackground(request)
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    // Mise en cache réussie
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Page offline de fallback
    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL) || generateOfflinePage()
    }
    throw error
  }
}

// Mise à jour cache en arrière-plan
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
  } catch (error) {
    // Ignore les erreurs de mise à jour en arrière-plan
  }
}

// Génération page audit offline
async function generateOfflineAuditPage(request) {
  const auditToken = request.url.split('/audit/')[1]
  
  // Récupération données audit en cache local
  const offlineData = await getOfflineAuditData(auditToken)
  
  return new Response(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV Audit EL - Mode Offline</title>
        <style>
            body { 
                background: #000; 
                color: #fff; 
                font-family: Arial; 
                padding: 20px;
                text-align: center;
            }
            .offline-container {
                max-width: 600px;
                margin: 50px auto;
                padding: 30px;
                border: 2px solid #fbbf24;
                border-radius: 10px;
            }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 15px; }
            .message { font-size: 16px; margin-bottom: 20px; color: #d1d5db; }
            .btn {
                background: #10b981;
                color: #fff;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                font-weight: bold;
                border-radius: 8px;
                cursor: pointer;
                margin: 10px;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="icon">📱</div>
            <div class="title">MODE OFFLINE ACTIVÉ</div>
            <div class="message">
                Connexion réseau indisponible.<br>
                Les données d'audit sont sauvegardées localement<br>
                et seront synchronisées au retour du réseau.
            </div>
            ${offlineData ? `
                <p><strong>Audit:</strong> ${offlineData.projectName}</p>
                <p><strong>Progression:</strong> Données locales disponibles</p>
                <button class="btn" onclick="location.reload()">RÉESSAYER</button>
            ` : `
                <p>Aucune donnée locale trouvée pour cet audit.</p>
                <button class="btn" onclick="history.back()">RETOUR</button>
            `}
            <button class="btn" onclick="location.href='/'">ACCUEIL</button>
        </div>
        
        <script>
            // Vérification périodique connectivité
            setInterval(() => {
                if (navigator.onLine) {
                    location.reload()
                }
            }, 5000)
        </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Récupération données audit offline
async function getOfflineAuditData(auditToken) {
  try {
    // Simulation récupération localStorage via message
    const clients = await self.clients.matchAll()
    
    if (clients.length > 0) {
      return new Promise((resolve) => {
        clients[0].postMessage({
          type: 'GET_OFFLINE_AUDIT_DATA',
          auditToken: auditToken
        })
        
        // Timeout après 1 seconde
        setTimeout(() => resolve(null), 1000)
      })
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Page offline générique
function generateOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DiagPV Audit - Offline</title>
        <style>
            body { 
                background: #000; 
                color: #fff; 
                font-family: Arial; 
                padding: 20px;
                text-align: center;
            }
            .container { max-width: 600px; margin: 100px auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #fbbf24; font-size: 28px; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🌙</div>
            <h1>DIAGPV AUDIT EL</h1>
            <p>Mode offline - Connexion réseau requise</p>
            <button onclick="location.reload()" style="background:#10b981;color:#fff;border:none;padding:15px 30px;border-radius:8px;font-weight:bold;cursor:pointer;">
                RÉESSAYER
            </button>
        </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Messages depuis la page
self.addEventListener('message', event => {
  const { type, data } = event.data
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (type === 'CACHE_AUDIT_DATA') {
    // Cache des données audit pour offline
    cacheAuditData(data)
  }
})

// Cache données audit
async function cacheAuditData(auditData) {
  const cache = await caches.open(CACHE_NAME)
  const cacheKey = `offline-audit-${auditData.token}`
  
  const response = new Response(JSON.stringify(auditData), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  await cache.put(cacheKey, response)
  console.log('💾 Audit data cached for offline:', auditData.token)
}