// ============================================================
//  Service Worker — Marina Porto Antico | Gestionale Turni PWA
// ============================================================
//  RICORDA: ad OGNI deploy incrementa il numero di versione qui
//  sotto (v3 -> v4 -> v5 ...). È il segnale che dice al browser
//  "c'è una versione nuova, scaricala".
// ============================================================

const CACHE_NAME = 'marina-turni-v3';   // <-- CAMBIA AD OGNI RILASCIO

// --- INSTALL: prepara la cache e attiva SUBITO la nuova versione ---
self.addEventListener('install', (event) => {
  self.skipWaiting();   // non aspetta la chiusura delle app aperte
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './index.html',
        './manifest.json'
      ]);
    }).catch(() => {})   // se un file manca, non blocca l'installazione
  );
});

// --- ACTIVATE: cancella le cache vecchie e prende il controllo delle pagine ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// --- FETCH: NETWORK FIRST ---
// Se online: sempre l'ultima versione dal server, e aggiorna la cache
// (write-through) così anche la copia offline resta la più recente.
// Se offline: ripiega sulla copia salvata in cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Salva in cache solo le risorse dello stesso dominio (GitHub Pages).
        // Supabase / jsdelivr / icons8 passano dirette senza essere cachate.
        if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
