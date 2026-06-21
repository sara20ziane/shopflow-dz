export function setupPwaMetadata() {
  addMeta("theme-color", "#0f172a");
  addLink("manifest", "/manifest.webmanifest");
  addLink("icon", "/icon.svg", "image/svg+xml");

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

function addMeta(name, content) {
  if (document.querySelector(`meta[name="${name}"]`)) return;

  const tag = document.createElement("meta");
  tag.setAttribute("name", name);
  tag.setAttribute("content", content);
  document.head.appendChild(tag);
}

function addLink(rel, href, type) {
  if (document.querySelector(`link[rel="${rel}"]`)) return;

  const tag = document.createElement("link");
  tag.setAttribute("rel", rel);
  tag.setAttribute("href", href);
  if (type) tag.setAttribute("type", type);
  document.head.appendChild(tag);
}
