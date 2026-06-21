import { useEffect } from "react";
import AppCorrected from "./AppCorrected.jsx";

const RESET_FR = {
  title: "Mot de passe oublié ?",
  line1: "Écris ton email dans le champ email.",
  line2: "Clique ici pour recevoir le lien de réinitialisation.",
  line3: "Vérifie ta boîte mail et les spams.",
};

const RESET_AR = {
  title: "نسيت كلمة المرور؟",
  line1: "اكتبي بريدك الإلكتروني في خانة البريد.",
  line2: "اضغطي هنا لاستلام رابط إعادة التعيين.",
  line3: "راجعي البريد الوارد أو الرسائل غير المرغوبة.",
};

function patchResetButton() {
  const isArabic = document.documentElement.dir === "rtl";
  const copy = isArabic ? RESET_AR : RESET_FR;

  document.querySelectorAll("button").forEach((button) => {
    const text = button.textContent || "";
    const isResetButton = text.includes("Mot de passe oublié") || text.includes("نسيت كلمة المرور");

    if (!isResetButton) return;

    const signature = `${copy.title}|${copy.line1}|${copy.line2}|${copy.line3}`;
    if (button.dataset.shopflowResetPatched === signature) return;

    button.dataset.shopflowReset = "true";
    button.dataset.shopflowResetPatched = signature;
    button.innerHTML = `
      <span class="shopflow-reset-title">${copy.title}</span>
      <span class="shopflow-reset-step">1. ${copy.line1}</span>
      <span class="shopflow-reset-step">2. ${copy.line2}</span>
      <span class="shopflow-reset-step">3. ${copy.line3}</span>
    `;
  });
}

export default function AppUxClean() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-shopflow-ux-clean", "true");
    style.textContent = `
      header .min-w-0 p:nth-child(2) {
        display: none !important;
      }

      header .min-w-0 p:first-child {
        font-size: 1.15rem !important;
        line-height: 1.25rem !important;
      }

      button[data-shopflow-reset="true"] {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0.35rem !important;
        text-align: left !important;
        border-radius: 1.25rem !important;
        border: 2px solid #00c4b4 !important;
        background: rgba(0, 229, 255, 0.10) !important;
        padding: 0.9rem 1rem !important;
        color: #07142b !important;
      }

      html[dir="rtl"] button[data-shopflow-reset="true"] {
        align-items: flex-end !important;
        text-align: right !important;
      }

      button[data-shopflow-reset="true"] .shopflow-reset-title {
        font-size: 0.95rem !important;
        font-weight: 900 !important;
        color: #07142b !important;
      }

      button[data-shopflow-reset="true"] .shopflow-reset-step {
        font-size: 0.78rem !important;
        font-weight: 700 !important;
        line-height: 1.2rem !important;
        color: rgba(7, 20, 43, 0.82) !important;
      }

      .bg-\[\#07142B\] button[data-shopflow-reset="true"],
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] {
        background: rgba(0, 229, 255, 0.12) !important;
        color: #ffffff !important;
      }

      .bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-title,
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-title,
      .bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-step,
      main.bg-\[\#07142B\] button[data-shopflow-reset="true"] .shopflow-reset-step {
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);

    patchResetButton();
    const observer = new MutationObserver(() => patchResetButton());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      style.remove();
    };
  }, []);

  return <AppCorrected />;
}
