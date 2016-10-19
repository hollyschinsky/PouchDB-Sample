// use a cacheName for cache versioning
var cacheName = 'v1:todos-pwa';

// during the install phase you usually want to cache static assets
self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install');
    // once the SW is installed, go ahead and fetch the resources to make this work offline
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            return cache.addAll([
                './',
                './lib/onsenui/css/font_awesome/css/font-awesome.min.css',                
                './lib/onsenui/css/ionicons/css/ionicons.min.css',
                './lib/onsenui/css/material-design-iconic-font/css/material-design-iconic-font.min.css',
               './lib/onsenui/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.ttf',                  
                './lib/onsenui/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.woff',
                './lib/onsenui/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.woff2',
                './lib/onsenui/css/ionicons/fonts/ionicons.woff',
                './lib/onsenui/css/onsenui.css',
                './lib/onsenui/css/onsen-css-components.css',
                './lib/onsenui/css/onsen-css-components-dark-theme.css',
                './css/style.css',                
                './lib/onsenui/js/onsenui.js',                
                './lib/pouchdb/pouchdb.min.js',
                './lib/pouchdb/pouchdb.cordova-sqlite.min.js',
                './js/app.js',
                './js/controllers.js',
                './js/services.js',                
                './offline.html',
                './cordova.js',
                './views/completed_tasks.html',
                './views/details_task.html',
                './views/menu.html',
                './views/new_task.html',
                './views/pending_tasks.html'
            ]).then(function() {
                self.skipWaiting();
            });
        })
    );
});


self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
});

// when the browser fetches a url
self.addEventListener('fetch', function(event) {
    // either respond with the cached object or go ahead and fetch the actual url
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                // retrieve from cache
                return response;
            }
            // fetch as normal
            return fetch(event.request);
        })
    );
});
