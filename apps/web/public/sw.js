/* LoopScreen — Service Worker do player (offline-first).
 *
 * - /uploads/*: servidos do Cache API quando já baixados (inclusive com Range,
 *   para os vídeos), senão vão para a rede. Só o player decide o que baixar
 *   (mensagem "sync"), então o cache tem exatamente as mídias da playlist.
 * - /assets/* (arquivos com hash): cache-first.
 * - navegação para /player: network-first, com a última versão em cache.
 */
const MEDIA_CACHE = 'loopscreen-media-v1';
const SHELL_CACHE = 'loopscreen-shell-v1';
const SHELL_PATHS = new Set(['/player', '/theme.js', '/favicon.svg']);

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([MEDIA_CACHE, SHELL_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith('loopscreen-') && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(serveMedia(request, url));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else if (SHELL_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(request, url.pathname));
  }
});

async function serveMedia(request, url) {
  const cache = await caches.open(MEDIA_CACHE);
  const cached = await cache.match(url.pathname);
  if (!cached) return fetch(request);

  const range = request.headers.get('range');
  if (!range) return cached;
  return rangeResponse(cached, range);
}

/** Monta uma resposta 206 a partir do arquivo completo guardado no cache. */
async function rangeResponse(cached, rangeHeader) {
  const blob = await cached.blob();
  const size = blob.size;
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  let start = match && match[1] !== '' ? Number(match[1]) : NaN;
  let end = match && match[2] !== '' ? Number(match[2]) : size - 1;
  if (match && match[1] === '' && match[2] !== '') {
    // "bytes=-500": últimos 500 bytes
    start = size - Number(match[2]);
    end = size - 1;
  }
  if (!match || Number.isNaN(start) || start >= size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  end = Math.min(end, size - 1);
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function cacheFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, key) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) await cache.put(key, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(key);
    if (cached) return cached;
    throw error;
  }
}

// ── Sincronização das mídias da playlist ─────────────────────────────────────
let syncing = null;
let pending = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'sync' || !Array.isArray(data.media)) return;
  pending = data;
  event.waitUntil(runSync(event.source));
});

async function runSync(client) {
  if (syncing) return syncing; // a sincronização em andamento pega o pedido mais recente
  syncing = (async () => {
    while (pending) {
      const job = pending;
      pending = null;
      await syncMedia(job.media);
      if (Array.isArray(job.assets)) await syncShell(job.assets);
    }
    client?.postMessage({ type: 'synced' });
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

/** Baixa o que falta (um por vez, para não saturar a rede) e remove o que saiu da playlist. */
async function syncMedia(paths) {
  const cache = await caches.open(MEDIA_CACHE);
  const wanted = new Set(paths);
  for (const path of wanted) {
    if (await cache.match(path)) continue;
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (response.ok && response.status === 200) await cache.put(path, response);
    } catch {
      // Sem rede: tenta de novo na próxima sincronização.
    }
  }
  for (const request of await cache.keys()) {
    if (!wanted.has(new URL(request.url).pathname)) await cache.delete(request);
  }
}

/**
 * Garante o app shell no cache (já no primeiro carregamento, quando a página
 * ainda não passava pelo SW) e remove assets de versões antigas.
 */
async function syncShell(assetPaths) {
  if (assetPaths.length === 0) return;
  const cache = await caches.open(SHELL_CACHE);
  for (const path of [...SHELL_PATHS, ...assetPaths]) {
    if (!path.startsWith('/assets/') || !(await cache.match(path))) {
      try {
        const response = await fetch(path, { cache: 'no-cache' });
        if (response.ok && response.status === 200) await cache.put(path, response);
      } catch {
        // Sem rede: fica para a próxima sincronização.
      }
    }
  }
  const keep = new Set(assetPaths);
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/assets/') && !keep.has(path)) await cache.delete(request);
  }
}
