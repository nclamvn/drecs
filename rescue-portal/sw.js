// ═══════════════════════════════════════════════════════════════
//                    DRECS - Service Worker
//                     Offline-First PWA
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME = 'drecs-rescue-v1';
const OFFLINE_URL = '/index.html';

// Files to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/screens.js',
    '/js/form.js',
    '/js/gps.js',
    '/js/storage.js',
    '/js/api.js',
    '/js/i18n.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://cdn.tailwindcss.com'
];

// ─────────────────────────────────────────────────────────────────
// INSTALL EVENT
// ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell...');
                // Cache local assets
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Force waiting SW to become active
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Cache failed:', err);
            })
    );
});

// ─────────────────────────────────────────────────────────────────
// ACTIVATE EVENT
// ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// ─────────────────────────────────────────────────────────────────
// FETCH EVENT - Network First, Cache Fallback
// ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests differently - network only, queue if offline
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // For page navigations - network first, cache fallback
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }
    
    // For other assets - cache first, network fallback
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Return offline placeholder for images
                        if (request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" fill="#9ca3af">Offline</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                    });
            })
    );
});

// ─────────────────────────────────────────────────────────────────
// HANDLE API REQUESTS
// ─────────────────────────────────────────────────────────────────
async function handleApiRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        // Network failed - return offline response
        return new Response(
            JSON.stringify({
                success: false,
                offline: true,
                message: 'Không có mạng. Yêu cầu đã được lưu và sẽ gửi khi có kết nối.'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// ─────────────────────────────────────────────────────────────────
// BACKGROUND SYNC - Send queued requests when online
// ─────────────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-rescue-requests') {
        console.log('[SW] Syncing rescue requests...');
        event.waitUntil(syncRescueRequests());
    }
});

async function syncRescueRequests() {
    // This will be called when connection is restored
    // The main app handles the actual queue processing
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({
            type: 'SYNC_READY',
            message: 'Connection restored - ready to sync'
        });
    });
}

// ─────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    console.log('[SW] Push received');
    
    let data = {
        title: 'Thông báo cứu hộ',
        body: 'Có thông tin mới từ trung tâm',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        tag: 'rescue-notification',
        requireInteraction: true,
        data: {}
    };
    
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            tag: data.tag,
            requireInteraction: data.requireInteraction,
            data: data.data,
            actions: [
                { action: 'view', title: 'Xem chi tiết' },
                { action: 'dismiss', title: 'Đóng' }
            ]
        })
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Focus existing window if any
                for (const client of clientList) {
                    if (client.url.includes('/index.html') && 'focus' in client) {
                        client.postMessage({
                            type: 'NOTIFICATION_CLICKED',
                            data: event.notification.data
                        });
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow('/index.html?screen=response');
                }
            })
    );
});

// ─────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

console.log('[SW] Service Worker loaded');
