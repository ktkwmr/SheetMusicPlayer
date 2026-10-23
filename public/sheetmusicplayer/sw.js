// Fixed cache name: fetches are network first, so the cache only needs to hold the latest copy.
// The reading engine (engine/<version>/, ~130 MB) is not stored here: omr-worker.mjs keeps it in
// its own cache ("sheetmusicplayer-engine-<version>"), and this worker only serves it from there
// (cache first) so the app also reads scores offline.
const PREFIX = "sheetmusicplayer-";
const CACHE = PREFIX + "cache";
const CORE = ["./", "index.html", "ja/", "omr-worker.mjs", "score-model.mjs", "editor.mjs", "manifest.json", "THIRD_PARTY_LICENSES.md",
  "vendor/opensheetmusicdisplay.min.js", "vendor/pdf.min.mjs", "vendor/pdf.worker.min.mjs"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        CORE.map((url) =>
          fetch(new Request(url, { cache: "reload" }))
            .then((res) => res.ok && cache.put(url, res))
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      // Only touch this app's page cache (other apps on the same origin share Cache Storage,
      // and the engine caches are managed by omr-worker.mjs)
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE && !k.startsWith(PREFIX + "engine-")).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // Engine files never change for a version: cache first, and never copied into the page cache
  if (new URL(req.url).pathname.includes("/sheetmusicplayer/engine/")) {
    event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
    return;
  }
  // Network first (always the latest when online), cache as offline fallback.
  event.respondWith(
    fetch(new Request(req.url, { cache: "no-cache" }))
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))
      )
  );
});
