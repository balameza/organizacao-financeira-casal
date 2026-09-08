const CACHE_NAME = "nosso-orcamento-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais nova
// do app e os dados atualizados do Firebase), cai pro cache só se estiver
// offline. Não intercepta chamadas ao Firebase/Google (deixa passar direto).
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  const isThirdParty =
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("google.com") ||
    url.includes("unpkg.com");
  if (isThirdParty || event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
