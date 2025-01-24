
// Change the version here if any of the following file changes

var CACHE_NAME = 'hemavati-v4';
var internalUrlsToCache = [
    "/offline"
];

OFFLINE_URL = "/offline";

var fileNamesToCache = [
    "w3.css",
    "essentia-wasm.web.js",
    "font-awesome.min.css",
    "plotly-basic-latest.min.js",
    "aubio.js",
    "aubio.wasm",
    "reverb.mp3",
    "offline.html",
    "acmp.mp3",
    "tonic",
    "songDB",
    "recorderWorklet.js",
    "pinkWorklet.js",
    "default.js",
];

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return (cacheName!=CACHE_NAME);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
// May want to remove the tonic here

// Add Offline files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(internalUrlsToCache);
      })
  );
});


self.addEventListener("fetch", (event) => {
    // We only want to call event.respondWith() if this is a navigation request
    // for an HTML page.
    if (event.request.mode === "navigate") {
        event.respondWith(
            (async () => {
            try {
                // First, try to use the navigation preload response if it's supported.
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                return preloadResponse;
                }

                // Always try the network first.
                const networkResponse = await fetch(event.request);
                return networkResponse;
            } catch (error) {
                console.log("Fetch failed; returning offline page instead.", error);
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(OFFLINE_URL);
                return cachedResponse;
            }
            })()
        );
    }
    else{
        event.respondWith((async function() {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) {
                  return cachedResponse;
                }
            
                const networkResponse = await fetch(event.request);
                
                if(networkResponse.status!=206)
                {
                    const clonedResponse = networkResponse.clone();
            
                    event.waitUntil((async function() {
                    if(doCaching(event.request.url)){
                      const cache = await caches.open(CACHE_NAME);
                      await cache.put(event.request, clonedResponse);
                    }
                    })());
                }
                return networkResponse;
              }
            )()
        );
    }
});

function doCaching(url){
  var yes = false;
 
  yes = fileNamesToCache.some(x=>url.endsWith(x)); //cache these
  yes = yes || (url.indexOf("jsstore/")!=-1);

  return yes;
}