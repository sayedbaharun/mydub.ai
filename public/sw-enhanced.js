/**
 * Enhanced Service Worker for MyDub.AI
 * Provides comprehensive offline functionality with smart caching strategies
 */

const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'mydub-ai';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const DATA_CACHE = `${CACHE_PREFIX}-data-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;

// Cache limits
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 100;
const MAX_DATA_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Essential static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API endpoints with their caching strategies
const API_STRATEGIES = {
  // Real-time data - Network first, cache fallback
  networkFirst: [
    '/api/weather',
    '/api/traffic',
    '/api/exchange-rates',
  ],
  
  // Content that updates periodically - Cache first, background refresh
  staleWhileRevalidate: [
    '/api/news',
    '/api/events',
    '/api/tourism',
    '/api/government',
  ],
  
  // Static content - Cache only
  cacheOnly: [
    '/api/arabic-phrases',
    '/api/static-content',
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[Service Worker] Install failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith(CACHE_PREFIX) &&
                     !cacheName.endsWith(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip browser extensions and external requests
  if (!url.origin.includes('mydub.ai') && !url.origin.includes('localhost')) {
    return;
  }
  
  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// Helper functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isApiRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('/supabase/');
}

function isPageRequest(request) {
  return request.mode === 'navigate' || 
         request.headers.get('accept').includes('text/html');
}

// Handle image requests - Cache first with size limits
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone the response before caching
      const responseToCache = response.clone();
      
      // Limit cache size
      const keys = await cache.keys();
      if (keys.length >= MAX_IMAGE_CACHE_ITEMS) {
        // Remove oldest entries
        const deleteCount = keys.length - MAX_IMAGE_CACHE_ITEMS + 1;
        for (let i = 0; i < deleteCount; i++) {
          await cache.delete(keys[i]);
        }
      }
      
      await cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    // Return placeholder image if available
    const placeholder = await cache.match('/images/placeholder.jpg');
    return placeholder || new Response('', { status: 404 });
  }
}

// Handle API requests based on strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine strategy
  if (API_STRATEGIES.networkFirst.some(pattern => pathname.includes(pattern))) {
    return networkFirstStrategy(request);
  } else if (API_STRATEGIES.staleWhileRevalidate.some(pattern => pathname.includes(pattern))) {
    return staleWhileRevalidateStrategy(request);
  } else if (API_STRATEGIES.cacheOnly.some(pattern => pathname.includes(pattern))) {
    return cacheOnlyStrategy(request);
  }
  
  // Default to network first
  return networkFirstStrategy(request);
}

// Handle page requests - Network first with offline fallback
async function handlePageRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
      await trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
    }
    
    return response;
  } catch (error) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

// Caching strategies
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    
    if (cached) {
      // Add header to indicate cached response
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', 'offline');
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached data available',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  
  // Return cached immediately if available
  if (cached) {
    // Revalidate in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {}); // Ignore revalidation errors
    
    return cached;
  }
  
  // No cache, fetch from network
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Network error',
        message: 'Unable to fetch data',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function cacheOnlyStrategy(request) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }
  
  // Try to fetch and cache if not available
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      await cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    // Ignore network errors for cache-only strategy
  }
  
  return new Response('Not found in cache', { status: 404 });
}

// Trim cache to size limit
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', async (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'sync-newsletter-signup') {
    event.waitUntil(syncNewsletterSignups());
  } else if (event.tag === 'sync-user-preferences') {
    event.waitUntil(syncUserPreferences());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    // Get offline queue from IndexedDB
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const requests = await store.getAll();
    
    for (const request of requests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });
        
        // Remove from queue on success
        const deleteTx = db.transaction('offline-queue', 'readwrite');
        await deleteTx.objectStore('offline-queue').delete(request.id);
      } catch (error) {
        console.error('[Service Worker] Sync failed for:', request.url);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync offline data:', error);
  }
}

// Sync newsletter signups
async function syncNewsletterSignups() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const signups = await store.index('type').getAll('newsletter-signup');
    
    for (const signup of signups) {
      try {
        await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signup.data)
        });
        
        const deleteTx = db.transaction('offline-queue', 'readwrite');
        await deleteTx.objectStore('offline-queue').delete(signup.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync newsletter signup:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync newsletter signups:', error);
  }
}

// Sync user preferences
async function syncUserPreferences() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-queue', 'readonly');
    const store = tx.objectStore('offline-queue');
    const preferences = await store.index('type').getAll('user-preferences');
    
    for (const pref of preferences) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pref.data)
        });
        
        const deleteTx = db.transaction('offline-queue', 'readwrite');
        await deleteTx.objectStore('offline-queue').delete(pref.id);
      } catch (error) {
        console.error('[Service Worker] Failed to sync user preferences:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync user preferences:', error);
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_ALL_CACHE':
      event.waitUntil(
        caches.keys()
          .then(cacheNames => Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          ))
      );
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        cacheUrls(event.data.urls, event.data.cacheName || DYNAMIC_CACHE)
      );
      break;
      
    case 'REMOVE_FROM_CACHE':
      event.waitUntil(
        removeFromCache(event.data.url)
      );
      break;
  }
});

// Cache specific URLs
async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error('[Service Worker] Failed to cache:', url);
    }
  }
}

// Remove URL from all caches
async function removeFromCache(url) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    await cache.delete(url);
  }
}

// Simple IndexedDB wrapper for offline queue
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mydub-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        const store = db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
        // Add indexes for different types of offline data
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Periodic cache cleanup (runs when browser thinks it's a good time)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  const now = Date.now();
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.includes('-data-')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
          const cacheTime = new Date(dateHeader).getTime();
          if (now - cacheTime > MAX_DATA_CACHE_AGE) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}
// Push Notification Handling
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  if (\!event.data) {
    console.warn('[Service Worker] Push notification with no data');
    return;
  }
  
  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Failed to parse push data:', error);
    return;
  }
  
  const { title, body, icon, badge, url, tag, category } = notificationData;
  
  const options = {
    body: body || 'New update from MyDub.AI',
    icon: icon || '/icon-192x192.png',
    badge: badge || '/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: tag || 'mydub-notification',
    data: {
      url: url || '/',
      category: category || 'general',
      timestamp: new Date().toISOString()
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/check.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/x.png'
      }
    ],
    requireInteraction: category === 'emergencies'
  };
  
  event.waitUntil(
    self.registration.showNotification(title || 'MyDub.AI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const notificationData = event.notification.data;
  const urlToOpen = notificationData.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
  
  // Track notification dismissals for analytics
  const notificationData = event.notification.data;
  
  // Send analytics event (implementation depends on your analytics setup)
  if (notificationData.category) {
    // You can implement tracking here
    console.log(`[Service Worker] ${notificationData.category} notification dismissed`);
  }
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: getVapidPublicKey()
    })
    .then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
    })
    .catch((error) => {
      console.error('[Service Worker] Failed to resubscribe:', error);
    })
  );
});

// Helper function to get VAPID public key
function getVapidPublicKey() {
  // This should be your actual VAPID public key
  const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
  return urlBase64ToUint8Array(vapidPublicKey);
}

// Convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
EOF < /dev/null