(() => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const calculatorRoutes = ["/calculateur", "/calculateur-business", "/business-calculator"];
  if (!calculatorRoutes.includes(path)) return;

  const SESSION_KEY = "nseyer-analytics-session-v1";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = window.crypto?.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source") || (() => {
    try {
      return document.referrer ? new URL(document.referrer).hostname : "direct";
    } catch {
      return "direct";
    }
  })();
  const medium = params.get("utm_medium") || "";
  const campaign = params.get("utm_campaign") || "";

  function track(event) {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        sessionId,
        source,
        medium,
        campaign,
        path,
      }),
    }).catch(() => {});
  }

  track("calculator_view");

  let started = false;
  document.addEventListener("input", (event) => {
    if (started || !event.target?.matches?.("input")) return;
    started = true;
    track("calculator_started");
  }, { passive: true });

  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("button, a");
    if (!target) return;
    const label = (target.textContent || "").replace(/\s+/g, " ").trim();

    if (label.includes("Voir mon verdict")) track("result_requested");
    if (label.includes("Ajouter mes vrais frais")) track("advanced_opened");
    if (label.includes("Partager mon résultat")) track("result_share_clicked");

    if (target.matches("[data-nseyer-interest]")) {
      track("beta_interest_clicked");
      target.disabled = true;
      target.textContent = "Merci ✓ intérêt enregistré";
      const note = target.parentElement?.querySelector("[data-nseyer-interest-note]");
      if (note) note.textContent = "Ça nous aide à décider quoi construire en priorité pour la beta.";
    }
  });

  function injectInterestButton() {
    if (document.querySelector("[data-nseyer-interest]")) return true;
    const sections = Array.from(document.querySelectorAll("section"));
    const target = sections.find((section) => {
      const text = section.textContent || "";
      return text.includes("LA SUITE") && text.includes("Imagine ce calcul automatique");
    });
    if (!target) return false;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.nseyerInterest = "true";
    button.className = "mt-4 w-full rounded-2xl bg-[#07142B] px-5 py-4 text-sm font-black text-white shadow-lg disabled:cursor-default disabled:opacity-80";
    button.textContent = "Je veux tester la beta";

    const note = document.createElement("p");
    note.dataset.nseyerInterestNote = "true";
    note.className = "mt-2 text-center text-[11px] leading-4 text-slate-500";
    note.textContent = "Pas d’inscription pour l’instant : ce clic nous sert seulement à mesurer l’intérêt réel.";

    target.appendChild(button);
    target.appendChild(note);
    return true;
  }

  if (!injectInterestButton()) {
    const observer = new MutationObserver(() => {
      if (injectInterestButton()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }
})();
