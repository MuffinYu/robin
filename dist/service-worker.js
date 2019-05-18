var dataCacheName = 'RobinBlog-v1'; // 缓存数据 辨识
var cacheName = 'RobinBlog-asserts-1'; // 缓存应用静态文件 辨识  
var filesToCache = [
  // '/',
  // '/index.html',
  // // '/scripts/app.js',
  // // '/styles/inline.css',
  // // '/images/clear.png',
  // // '/images/cloudy-scattered-showers.png',
  // // '/images/cloudy.png',
  // // '/images/fog.png',
  // // '/images/ic_add_white_24px.svg',
  // // '/images/ic_refresh_white_24px.svg',
  // // '/images/partly-cloudy.png',
  // // '/images/rain.png',
  // // '/images/scattered-showers.png',
  // // '/images/sleet.png',
  // // '/images/snow.png',
  // // '/images/thunderstorm.png',
  // // '/images/wind.png'
  // "/",
  "./index.html",
  "./scripts/index.js",
  "./styles/index.css",
  "./styles/iconfont.css",
  "./favicon.ico",
  "./asserts/icon-32x32.png",
  "./asserts/icon-128x128.png",
  "./asserts/icon-144x144.png",
  "./asserts/icon-152x152.png",
  "./asserts/icon-192x192.png",
  "./asserts/icon-256x256.png"
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  /*
   * Fixes a corner case in which the app wasn't returning the latest data.
   * You can reproduce the corner case by commenting out the line below and
   * then doing the following steps: 1) load app for first time so that the
   * initial New York City data is shown 2) press the refresh button on the
   * app 3) go offline 4) reload the app. You expect to see the newer NYC
   * data, but you actually see the initial data. This happens because the
   * service worker is not yet activated. The code below essentially lets
   * you activate the service worker faster.
   */
  return self.clients.claim();
});

// self.addEventListener('fetch', function(e) {
//   console.log('[Service Worker] Fetch', e.request.url);
//   var dataUrl = "https://muffinyu.github.io/robin";
//   if (e.request.url.indexOf(dataUrl) > -1) {
//     /*
//      * When the request URL contains dataUrl, the app is asking for fresh
//      * weather data. In this case, the service worker always goes to the
//      * network and then caches the response. This is called the "Cache then
//      * network" strategy:
//      * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
//      */
//     e.respondWith(
//       caches.open(dataCacheName).then(function(cache) {
//         return fetch(e.request).then(function(response){
//           cache.put(e.request.url, response.clone());
//           return response;
//         });
//       })
//     );
//   } else {
//     /*
//      * The app is asking for app shell files. In this scenario the app uses the
//      * "Cache, falling back to the network" offline strategy:
//      * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
//      */
//     e.respondWith(
//       caches.match(e.request).then(function(response) {
//         console.log('caches match', response);
        
//         return response || fetch(e.request);
//       })
//     );
//   }
// });


self.addEventListener("fetch", function(e) {
  function getResponse(e) {
    try {
      return fetch(e.request).then(function(response) {
        console.log("fetch ok", response);
        var resClone = response.clone();
        var url = e.request.url;
        caches.open(cacheName).then(function(cache) {
          cache.put(url, resClone);
        });
        return response;
      }).catch(function(err) {
        console.log("fetch err", err);
        return caches.match(e.request.url);
        // throw err;
      });
    } catch (error) {
      console.log("fetch fall back", error);
      return caches.match(e.request.url);
    }
  }
  e.respondWith(getResponse(e));
});