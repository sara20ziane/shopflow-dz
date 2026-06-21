export function setupPwaMetadata() {
  addMeta("theme-color", "#0f172a");
  addMeta("shopflow-version", "cache-fix-2026-06-21");
  addLink("manifest", "/manifest.webmanifest?v=cache-fix-2026-06-21");
  addLink("icon", "/icon.svg?v=cache-fix-2026-06-21", "image/svg+xml");

  // Temporaire pendant la beta : on désactive le service worker
  // pour éviter que Chrome/PWA garde une ancienne version de l'application.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch {}

      try {
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {}
    });
  }
}

function addMeta(name, content) {
  const existing = document.querySelector(`meta[name="${name}"]`);
  if (existing) {
    existing.setAttribute("content", content);
    return;
  }

  const tag = document.createElement("meta");
  tag.setAttribute("name", name);
  tag.setAttribute("content", content);
  document.head.appendChild(tag);
}

function addLink(rel, href, type) {
  const existing = document.querySelector(`link[rel="${rel}"]`);
  if (existing) {
    existing.setAttribute("href", href);
    if (type) existing.setAttribute("type", type);
    return;
  }

  const tag = document.createElement("link");
  tag.setAttribute("rel", rel);
  tag.setAttribute("href", href);
  if (type) tag.setAttribute("type", type);
  document.head.appendChild(tag);
}
