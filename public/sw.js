// Service Worker DiagPV - Stratégie "Network First, falling back to Cache"
// Version: 1.1 (Mode Terrain)

const CACHE_NAME = 'diagpv-v1-static';
const DATA_CACHE_NAME = 'diagpv-v1-data';

// Fichiers critiques à mettre en cache immédiatement (Le "Coquille" de l'app)
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/pv/plants',
  '/manifest.json',
  '/favicon.svg',
  '/static/diagpv-styles.css',
  '/static/diagpv-app.js',
  '/static/diagpv-audit.js',
  '/static/diagpv-measures.js',
  '/static/pv/editor.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js',
  'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js'
];

// Installation : Mise en cache des assets statiques
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation du mode Terrain...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache du noyau DiagPV');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Force l'activation immédiate
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Stratégie pour les APIs (/api/) : Network First (Toujours essayer le réseau, jamais de cache vieux)
  // Note: La gestion "Offline Write" se fait dans le code JS de l'app (localStorage), pas ici.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si réseau échoue pour une API, on renvoie une erreur JSON spécifique que l'app peut gérer
          return new Response(
            JSON.stringify({ error: 'OFFLINE_MODE', message: 'Pas de connexion réseau' }),
            { 
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        })
    );
    return;
  }

  // 2. Stratégie pour les assets statiques et pages HTML : Stale-While-Revalidate
  // (Sert le cache tout de suite pour la vitesse, puis met à jour en arrière-plan)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Mise à jour du cache si la réponse est valide
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Si on a le fichier en cache, on le sert direct (Vitesse MAX)
      // Sinon on attend le réseau
      return cachedResponse || fetchPromise;
    }).catch(() => {
      // Si tout échoue (pas de cache, pas de réseau), page de secours (si c'est du HTML)
      if (event.request.headers.get('accept').includes('text/html')) {
        return caches.match('/dashboard'); // Retour au dashboard en mode dégradé
      }
    })
  );
});