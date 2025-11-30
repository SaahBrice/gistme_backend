importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// PWA Configuration
const CACHE_NAME = 'gist4u-v1';
const RUNTIME_CACHE = 'gist4u-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/feed/',
    '/static/web/css/main.css',
    '/static/web/js/main.js',
    '/static/web/icons/icon-192x192.png',
    '/static/web/icons/icon-512x512.png',
];

// Initialize the Firebase app in the service worker
const firebaseConfig = {
    apiKey: "AIzaSyBA9udkHboIsuVAzpVzsMa-pH_CrygGidA",
    authDomain: "c237-bvo0kf.firebaseapp.com",
    projectId: "c237-bvo0kf",
    storageBucket: "c237-bvo0kf.appspot.com",
    messagingSenderId: "426706752627",
    appId: "1:426706752627:web:de1cf08f4717d7ac934606"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// PWA Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(err => console.error('[Service Worker] Cache failed:', err))
    );
    self.skipWaiting();
});

// PWA Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => {
                        console.log('[Service Worker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    return self.clients.claim();
});

// PWA Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone the response
                const responseClone = response.clone();

                // Cache successful responses
                if (response.status === 200) {
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // The Firebase SDK handles displaying the notification automatically 
    // when the 'notification' key is present in the payload.
    // We don't need to call showNotification manually unless we are handling data-only messages.

    // If you want to customize it, you can do it here, but be careful of duplicates.
    // For now, we rely on the default SDK behavior which uses the 'notification' payload.
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click received');
    console.log('Event:', event);
    console.log('Notification data:', event.notification.data);

    event.notification.close();

    // Extract URL from notification data
    // Firebase can store the URL in different places depending on how the notification was sent
    let url = '/';

    try {
        // Try to get URL from various possible locations
        if (event.notification.data) {
            // Check FCM_MSG wrapper first (common in Firebase)
            if (event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.data) {
                url = event.notification.data.FCM_MSG.data.link ||
                    event.notification.data.FCM_MSG.data.click_action ||
                    url;
            }
            // Check direct data fields
            else if (event.notification.data.link) {
                url = event.notification.data.link;
            } else if (event.notification.data.click_action) {
                url = event.notification.data.click_action;
            }
        }

        console.log('Opening URL:', url);
    } catch (error) {
        console.error('Error extracting URL from notification:', error);
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            console.log('Found', windowClients.length, 'window clients');

            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                console.log('Checking client:', client.url);

                // Check if URL matches (handle both full URL and relative path)
                const clientPath = new URL(client.url).pathname;
                const targetPath = url.startsWith('http') ? new URL(url).pathname : url;

                if (clientPath === targetPath && 'focus' in client) {
                    console.log('Focusing existing window');
                    return client.focus();
                }
            }

            // If not, open the target URL in a new window/tab
            if (clients.openWindow) {
                console.log('Opening new window');
                return clients.openWindow(url);
            }
        }).catch(error => {
            console.error('Error handling notification click:', error);
        })
    );
});
