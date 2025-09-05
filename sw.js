// Service Worker for EternaData - Simple and Reliable
// Version 1.0.0

const CACHE_NAME = 'eternadata-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Core files to cache immediately
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/assets/styles.css',
    '/assets/script.js',
    '/assets/logo.svg',
    '/assets/favicon.svg',
    '/offline.html'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('ServiceWorker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static resources');
                return cache.addAll(STATIC_CACHE);
            })
            .catch((error) => {
                console.error('Failed to cache resources:', error);
            })
    );
    
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('ServiceWorker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external URLs
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(handleRequest(event.request));
});

// Handle different types of requests
async function handleRequest(request) {
    try {
        // Try network first for HTML pages
        if (request.destination === 'document') {
            return await handleDocumentRequest(request);
        }
        
        // Cache first for assets
        return await handleAssetRequest(request);
        
    } catch (error) {
        console.error('Request handling error:', error);
        
        // Fallback to offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match(OFFLINE_PAGE);
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Handle document (HTML) requests
async function handleDocumentRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        // Network failed - try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // No cache - return offline page
        return caches.match(OFFLINE_PAGE);
    }
}

// Handle asset requests (CSS, JS, images)
async function handleAssetRequest(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Not in cache - fetch from network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Network failed and not in cache
        return new Response('Asset not available offline', { 
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({ version: CACHE_NAME });
                break;
                
            default:
                console.log('Unknown message type:', event.data.type);
        }
    }
});

console.log('EternaData ServiceWorker loaded successfully');