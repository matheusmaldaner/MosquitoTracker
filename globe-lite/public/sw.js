const CACHE_NAME = 'globe-lite-v2';
const STATIC_ASSETS = [
  '/',
  '/observe',
  '/gallery',
  '/compare',
  '/pending',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: only intercept GET requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // API calls: network first, fallback to cache
  if (url.hostname === 'api.globe.gov') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets and pages: cache first, then network, fallback to offline page
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      
      return fetch(request)
        .then((response) => {
          // Cache successful responses for same-origin requests
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Background sync for pending observations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-observations') {
    event.waitUntil(syncPendingObservations());
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    syncPendingObservations();
  }
});

async function syncPendingObservations() {
  // Notify clients that sync has started
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_STARTED' });
  });

  try {
    // Open IndexedDB
    const db = await openIndexedDB();
    const observations = await getAllPendingObservations(db);

    let successCount = 0;
    let failCount = 0;

    for (const obs of observations) {
      try {
        // For now, simulate upload (actual implementation needs API key)
        await simulateUpload(obs);
        await deleteObservation(db, obs.id);
        successCount++;
      } catch (error) {
        failCount++;
        await updateStatus(db, obs.id, 'failed');
      }
    }

    // Notify clients of completion
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { success: successCount, failed: failCount }
      });
    });
  } catch (error) {
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_ERROR', error: error.message });
    });
  }
}

// IndexedDB helpers for service worker
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('globe-lite-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-observations')) {
        db.createObjectStore('pending-observations', { keyPath: 'id' });
      }
    };
  });
}

function getAllPendingObservations(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-observations', 'readonly');
    const store = tx.objectStore('pending-observations');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.filter(o => o.status === 'pending' || o.status === 'failed'));
    request.onerror = () => reject(request.error);
  });
}

function deleteObservation(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-observations', 'readwrite');
    const store = tx.objectStore('pending-observations');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function updateStatus(db, id, status) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-observations', 'readwrite');
    const store = tx.objectStore('pending-observations');
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const obs = getRequest.result;
      if (obs) {
        obs.status = status;
        const putRequest = store.put(obs);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

function simulateUpload(observation) {
  // Simulate network delay and potential failure
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 90% success rate for demo
      if (Math.random() > 0.1) {
        console.log('[SW] Uploaded:', observation.id);
        resolve();
      } else {
        reject(new Error('Simulated upload failure'));
      }
    }, 1000);
  });
}