/* Master GMDSS service worker
   Saves the app on the phone so it opens without internet, and picks up new versions.
   IMPORTANT: change VERSION every time you publish changes, so phones download the new files. */
const VERSION = 'v1.1.2';
const CACHE = 'master-gmdss-' + VERSION;

// Everything the app needs to start offline (paths are relative to this file)
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'shared/css/base.css', 'shared/js/app.js', 'shared/img/contour.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'vhf/', 'vhf/index.html', 'vhf/css/vhf.css',
  'vhf/js/core.js', 'vhf/js/checking.js', 'vhf/js/scenarios.js', 'vhf/js/voice.js', 'vhf/js/radio.js', 'vhf/js/trainer.js',
  'quiz/', 'quiz/index.html', 'quiz/css/quiz.css', 'quiz/js/questions.js', 'quiz/js/quiz.js',
  'study/cheat-sheets.html', 'study/equipment-cards.html', 'study/callsigns-navtex.html'
];

// 1. Install: download and save all files
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 2. Activate: delete files saved by older versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('master-gmdss-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 3. Fetch: pages try the network first (so you get updates), everything else comes from the saved copy first
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: save a copy the first time they load
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => { caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
    return res;
  })));
});
