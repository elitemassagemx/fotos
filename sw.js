// Service Worker optimizado para Elite Massage
const APP_VERSION = '1.1.0';
const CACHE_PREFIX = 'elite-massage';

const CACHE_NAMES = {
    static: `${CACHE_PREFIX}-static-${APP_VERSION}`,
    images: `${CACHE_PREFIX}-images-${APP_VERSION}`,
    fonts: `${CACHE_PREFIX}-fonts-${APP_VERSION}`,
    dynamic: `${CACHE_PREFIX}-dynamic-${APP_VERSION}`
};

const ASSETS = {
    static: [
        '/',
        '/index.html',
        '/css/styles.css',
        '/js/script.js',
        '/manifest.json',
        '/favicon.ico',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/ScrollTrigger.min.js'
    ],
    images: [
        'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/logo.webp',
        'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp'
    ],
    fonts: [
        'https://fonts.googleapis.com/css2?family=Tenor+Sans&display=swap',
        'https://fonts.googleapis.com/css2?family=Quattrocento:wght@400;700&display=swap'
    ]
};

const IGNORED_HOSTS = [
    'google-analytics.com',
    'analytics',
    'doubleclick.net',
    'facebook.com',
    'google.com'
];

// Estrategias de caché optimizadas
const strategies = {
    cacheFirst: async (request) => {
        const cache = await caches.open(CACHE_NAMES.static);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                await cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            return createErrorResponse('Recurso no disponible');
        }
    },

    networkFirst: async (request) => {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAMES.dynamic);
                await cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) return cachedResponse;
        }
        return createErrorResponse('No hay conexión');
    },

    staleWhileRevalidate: async (request) => {
        const cache = await caches.open(CACHE_NAMES.dynamic);
        const cachedResponse = await cache.match(request);

        const networkUpdate = fetch(request)
            .then(async response => {
                if (response.ok) {
                    await cache.put(request, response.clone());
                }
                return response;
            })
            .catch(() => createErrorResponse('Error de red'));

        return cachedResponse || networkUpdate;
    }
};

// Instalación mejorada
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        try {
            const cachePromises = Object.entries(ASSETS).map(async ([type, urls]) => {
                const cache = await caches.open(CACHE_NAMES[type]);
                return cache.addAll(urls.map(url => new Request(url, {mode: 'cors'})));
            });

            await Promise.all(cachePromises);
            await self.skipWaiting();
        } catch (error) {
            console.error('Error en instalación:', error);
        }
    })());
});

// Activación con limpieza de caché
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        try {
            await self.clients.claim();
            const keys = await caches.keys();
            const deletions = keys
                .filter(key => key.startsWith(CACHE_PREFIX) && !Object.values(CACHE_NAMES).includes(key))
                .map(key => caches.delete(key));
            await Promise.all(deletions);
        } catch (error) {
            console.error('Error en activación:', error);
        }
    })());
});

// Interceptor de peticiones mejorado
self.addEventListener('fetch', event => {
    if (shouldIgnore(event.request)) return;

    event.respondWith((async () => {
        try {
            const strategy = getStrategy(event.request);
            return await strategy(event.request);
        } catch (error) {
            console.error('Error en fetch:', error);
            return createErrorResponse('Error en la petición');
        }
    })());
});

// Funciones auxiliares optimizadas
function shouldIgnore(request) {
    return IGNORED_HOSTS.some(host => request.url.includes(host)) ||
           request.method !== 'GET';
}

function getStrategy(request) {
    // Assets estáticos
    if (ASSETS.static.includes(request.url)) {
        return strategies.cacheFirst;
    }

    // Imágenes
    if (request.destination === 'image' || ASSETS.images.includes(request.url)) {
        return strategies.cacheFirst;
    }

    // Fuentes
    if (request.destination === 'font' || ASSETS.fonts.includes(request.url)) {
        return strategies.cacheFirst;
    }

    // API y datos dinámicos
    if (request.url.includes('/api/') || request.url.includes('data.json')) {
        return strategies.networkFirst;
    }

    // Por defecto
    return strategies.staleWhileRevalidate;
}

function createErrorResponse(message) {
    return new Response(message, {
        status: 408,
        headers: new Headers({
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store'
        })
    });
}

// Manejo de mensajes y errores
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('error', event => {
    console.error('SW Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

self.addEventListener('unhandledrejection', event => {
    console.error('SW Unhandled Rejection:', event.reason);
});
