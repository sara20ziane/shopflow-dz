import { useEffect } from "react";
import { signOut } from "firebase/auth";
import AppCorrected from "./AppCorrected.jsx";
import { auth } from "./firebase";

const RESET_FR = {
  title: "Mot de passe oublié ?",
  help: "Écris ton email au-dessus, puis clique sur le bouton.",
  action: "Envoyer le lien de réinitialisation",
};

const RESET_AR = {
  title: "نسيت كلمة المرور؟",
  help: "اكتبي بريدك الإلكتروني في الأعلى ثم اضغطي على الزر.",
  action: "إرسال رابط إعادة التعيين",
};

function cleanHeaderBranding() {
  document.querySelectorAll("header").forEach((header) => {
    header.querySelectorAll('img[alt="ShopFlow DZ"], img[src*="shopflow-logo"]').forEach((img) => {
      img.style.display = "none";
    });

    header.querySelectorAll("p").forEach((p) => {
      const text = (p.textContent || "").trim().toLowerCase();
      if (text === "shopflow dz") {
        p.style.display = "none";
      }
    });
  });

  document.querySelectorAll("h1, h2").forEach((title) => {
    const text = (title.textContent || "").trim();
    if (text === "Bienvenue sur ShopFlow DZ") title.textContent = "Bienvenue";
    if (text === "مرحبا بك في ShopFlow DZ") title.textContent = "مرحبا بك";
  });
}

function patchResetButton() {
  const isArabic = document.documentElement.dir === "rtl";
  const copy = isArabic ? RESET_AR : RESET_FR;

  document.querySelectorAll("button").forEach((button) => {
    const text = button.textContent || "";
    const isResetButton = text.includes("Mot de passe oublié") || text.includes("نسيت كلمة المرور");

    if (!isResetButton) return;

    const signature = `${copy.title}|${copy.help}|${copy.action}`;
    if (button.dataset.shopflowResetPatched === signature) return;

    button.dataset.shopflowReset = "true";
    button.dataset.shopflowResetPatched = signature;
    button.innerHTML = `
      <span class="shopflow-reset-title">${copy.title}</span>
      <span class="shopflow-reset-help">${copy.help}</span>
      <span class="shopflow-reset-action">${copy.action}</span>
    `;
  });
}

function ensureLogoutButton() {
  const header = document.querySelector("header");
  const loginScreen = document.querySelector('form input[type="password"]') && !header;
  const existing = document.querySelector("#shopflow-visible-logout");

  if (!header || loginScreen) {
    existing?.remove();
    return;
  }

  if (existing) return;

  const button = document.createElement("button");
  button.id = "shopflow-visible-logout";
  button.type = "button";
  button.textContent = document.documentElement.dir === "rtl" ? "خروج" : "Déconnexion";
  button.addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });
  document.body.appendChild(button);
}

function applyUxCleanups() {
  cleanHeaderBranding();
  patchResetButton();
  ensureLogoutButton();
}

export default function AppUxClean() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-shopflow-ux-clean", "true");
    style.textContent = `
      header img[alt="ShopFlow DZ"],
      header img[src*="shopflow-logo"] {
        display: none !important;
      }

      header .min-w-0 p:nth-child(2),
      header p.shopflow-duplicate-brand {
        display: none !important;
      }

      header .min-w-0 p:first-child {
        font-size: 1.15rem !important;
        line-height: 1.25rem !important;
      }

      header button:has(+ #shopflow-visible-logout) {
        display: none !important;
      }

      #shopflow-visible-logout {
        position: fixed !important;
        right: 1rem !important;
        bottom: 6rem !important;
        z-index: 9999 !important;
        border: none !important;
        border-radius: 999px !important;
        background: #fee2e2 !important;
        color: #dc2626 !important;
        padding: 0.8rem 1rem !important;
        font-size: 0.82rem !important;
        font-weight: 900 !important;
        box-shadow: 0 14px 35px rgba(15, 23, 42, 0.22) !important;
      }

      html[dir="rtl"] #shopflow-visible-logout {
        right: auto !important;
        left: 1rem !important;
      }

      button[data-shopflow-reset="true"] {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 0.45rem !important;
        text-align: left !important;
        border-radius: 1rem !important;
        border: 1px solid rgba(0, 196, 180, 0.55) !important;
        background: rgba(0, 229, 255, 0.08) !important;
        padding: 0.85rem !important;
        color: #07142b !important;
      }

      html[dir="rtl"] button[data-shopflow-reset="true"] {
        text-align: right !important;
      }

      button[data-shopflow-reset="true"] .shopflow-reset-title {
        font-size: 0.9rem !important;
        font-weight: 900 !important;
        color: #07142b !important;
      }

      button[data-shopflow-reset="true"] .shopflow-reset-help {
        font-size: 0.78rem !important;
        font-weight: 600 !important;
        line-height: 1.15rem !important;
        color: rgba(7, 20, 43, 0.72) !important;
      }

      button[data-shopflow-reset="true"] .shopflow-reset-action {
        margin-top: 0.1rem !important;
        display: inline-flex !important;
        justify-content: center !important;
        border-radius: 0.8rem !important;
        background: linear-gradient(90deg, #00E5FF, #00C4B4) !important;
        padding: 0.55rem 0.75rem !important;
        font-size: 0.82rem !important;
        font-weight: 900 !important;
        color: #07142b !important;
      }

      .bg-\[\#07142B\] button[data-shopflow-reset="true"],
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] {
        background: rgba(0, 229, 255, 0.10) !important;
        color: #ffffff !important;
      }

      .bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-title,
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-title,
      .bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-help,
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-help {
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);

    applyUxCleanups();
    const observer = new MutationObserver(() => applyUxCleanups());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      document.querySelector("#shopflow-visible-logout")?.remove();
      style.remove();
    };
  }, []);

  return <AppCorrected />;
}
