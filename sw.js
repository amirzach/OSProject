const CACHE_NAME = 'amiros-v1';
const urlsToCache = [
    './',
    './AmirOS.html',
    './manifest.json',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }
                
                console.log('Fetching from network:', event.request.url);
                return fetch(event.request).then(function(response) {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(function() {
                // Return a fallback page if both cache and network fail
                if (event.request.destination === 'document') {
                    return caches.match('./');
                }
            })
    );
});

// Handle background sync (optional)
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Handle background tasks here
    }
});

// Handle push notifications (optional)
self.addEventListener('push', function(event) {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: 'icon-192.png',
            badge: 'icon-192.png'
        };
        
        event.waitUntil(
            self.registration.showNotification('AmirOS', options)
        );
    }
});