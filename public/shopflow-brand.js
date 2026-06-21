(() => {
  const INSTAGRAM_URL = "https://www.instagram.com/shopflowdz/";
  const LOGO_URL = "/shopflow-logo.svg";

  const frToAr = {
    "ShopFlow DZ": "ShopFlow DZ",
    "Connexion": "دخول",
    "Inscription": "تسجيل",
    "Gère tes commandes, tes acomptes, tes clientes et tes bénéfices sans cahier ni Excel.": "نظمي طلباتك، الدفعات، العميلات والأرباح بدون دفتر ولا Excel.",
    "Version beta en préparation 🇩🇿": "نسخة تجريبية قيد التحضير 🇩🇿",
    "Chargement...": "جار التحميل...",
    "Se connecter": "دخول",
    "Créer mon compte": "إنشاء حسابي",
    "Sortir": "خروج",
    "Accueil": "الرئيسية",
    "Ajouter": "إضافة",
    "Cmdes": "طلبات",
    "Paiem.": "دفع",
    "Livr.": "توصيل",
    "Clients": "عميلات",
    "Tableau de bord": "لوحة التحكم",
    "Résumé de ton activité": "ملخص نشاطك",
    "Commandes": "الطلبات",
    "Actives": "نشطة",
    "Prêtes": "جاهزة",
    "En livraison": "في التوصيل",
    "Livrées": "تم التوصيل",
    "CA total": "رقم الأعمال",
    "Acomptes": "الدفعات",
    "Reste": "الباقي",
    "Bénéfice estimé": "الربح التقديري",
    "Les commandes annulées et les retours ne sont pas comptés dans le CA.": "الطلبات الملغاة والمرتجعة لا تُحسب في رقم الأعمال.",
    "Nouvelle commande": "طلب جديد",
    "Ajoute une commande cliente": "أضيفي طلب عميلة",
    "Enregistrer la commande": "حفظ الطلب",
    "Enregistrement...": "جار الحفظ...",
    "Liste de tes commandes": "قائمة طلباتك",
    "Tous": "الكل",
    "Aucune commande pour le moment.": "لا توجد طلبات حاليا.",
    "Aucune commande ne correspond à ta recherche.": "لا يوجد طلب مطابق للبحث.",
    "Modifier": "تعديل",
    "Annuler": "إلغاء",
    "Supprimer": "حذف",
    "Sauvegarder": "حفظ",
    "Paiements / Acomptes": "الدفعات / العربون",
    "Suivi des montants encaissés et restants": "متابعة المبالغ المدفوعة والباقية",
    "À encaisser": "للاستلام",
    "Soldées": "مسددة",
    "Toutes": "الكل",
    "Livraison / Suivi colis": "التوصيل / تتبع الطرود",
    "Suis les commandes prêtes, en livraison et livrées": "تابعي الطلبات الجاهزة، قيد التوصيل والمسلمة",
    "Fiche clientes": "ملف العميلات",
    "Tes clientes sont générées automatiquement depuis les commandes": "يتم إنشاء العميلات تلقائيا من الطلبات",
    "Contacter": "تواصلي",
    "Statut": "الحالة",
    "Nouvelle": "جديدة",
    "En attente paiement": "بانتظار الدفع",
    "Confirmée": "مؤكدة",
    "Commandée fournisseur": "طلبت من المورد",
    "Reçue": "تم الاستلام",
    "Livrée": "تم التوصيل",
    "Annulée": "ملغاة",
    "Retour": "إرجاع"
  };

  const placeholders = {
    "Nom de la boutique": "اسم المتجر",
    "Adresse email": "البريد الإلكتروني",
    "Mot de passe": "كلمة المرور",
    "Rechercher cliente, téléphone ou produit": "ابحثي عن عميلة، هاتف أو منتج",
    "Nom de la cliente": "اسم العميلة",
    "Téléphone": "الهاتف",
    "Produit": "المنتج",
    "Prix de vente": "سعر البيع",
    "Prix d'achat": "سعر الشراء",
    "Acompte payé": "العربون المدفوع",
    "Société de livraison": "شركة التوصيل",
    "Code de suivi": "كود التتبع",
    "Note": "ملاحظة"
  };

  const arToFr = Object.fromEntries(Object.entries(frToAr).map(([fr, ar]) => [ar, fr]));
  const placeholdersArToFr = Object.fromEntries(Object.entries(placeholders).map(([fr, ar]) => [ar, fr]));

  const state = {
    lang: localStorage.getItem("sf-lang") || "fr",
    theme: localStorage.getItem("sf-theme") || "light"
  };

  function clean(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  function applyTheme() {
    document.body.dataset.sfTheme = state.theme;
    document.documentElement.dataset.sfTheme = state.theme;
    document.querySelectorAll("[data-sf-theme]").forEach((el) => {
      el.dataset.sfTheme = state.theme;
    });
    document.querySelectorAll("[data-sf-theme-choice]").forEach((btn) => {
      btn.classList.toggle("sf-active", btn.dataset.sfThemeChoice === state.theme);
    });
  }

  function applyLang() {
    document.documentElement.lang = state.lang === "ar" ? "ar" : "fr";
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-sf-lang-choice]").forEach((btn) => {
      btn.classList.toggle("sf-active", btn.dataset.sfLangChoice === state.lang);
    });

    translateNode(document.body);
  }

  function translateText(text) {
    const value = clean(text);
    if (!value) return text;
    if (state.lang === "ar") return frToAr[value] || text;
    return arToFr[value] || text;
  }

  function translateNode(root) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!clean(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".sf-floating-controls, .sf-brand-header, .sf-brand-header-mini")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const next = translateText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });

    root.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((input) => {
      const value = clean(input.getAttribute("placeholder") || "");
      if (state.lang === "ar" && placeholders[value]) input.setAttribute("placeholder", placeholders[value]);
      if (state.lang === "fr" && placeholdersArToFr[value]) input.setAttribute("placeholder", placeholdersArToFr[value]);
    });
  }

  function addControls() {
    if (document.querySelector(".sf-floating-controls")) return;

    const controls = document.createElement("div");
    controls.className = "sf-floating-controls";
    controls.innerHTML = `
      <div class="sf-switch-group" aria-label="Langue">
        <button type="button" data-sf-lang-choice="fr">FR</button>
        <button type="button" data-sf-lang-choice="ar">AR</button>
      </div>
      <div class="sf-switch-group" aria-label="Mode">
        <button type="button" data-sf-theme-choice="light">☀️</button>
        <button type="button" data-sf-theme-choice="dark">🌙</button>
      </div>
    `;

    controls.addEventListener("click", (event) => {
      const langBtn = event.target.closest("[data-sf-lang-choice]");
      const themeBtn = event.target.closest("[data-sf-theme-choice]");

      if (langBtn) {
        state.lang = langBtn.dataset.sfLangChoice;
        localStorage.setItem("sf-lang", state.lang);
        applyLang();
      }

      if (themeBtn) {
        state.theme = themeBtn.dataset.sfThemeChoice;
        localStorage.setItem("sf-theme", state.theme);
        applyTheme();
      }
    });

    document.body.appendChild(controls);
  }

  function addInstagramButton() {
    if (document.querySelector(".sf-instagram-float")) return;
    const link = document.createElement("a");
    link.href = INSTAGRAM_URL;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "sf-instagram-float";
    link.title = "Instagram ShopFlow DZ";
    link.textContent = "◎";
    document.body.appendChild(link);
  }

  function upgradeLogo() {
    document.querySelectorAll("h1").forEach((title) => {
      if (!title.textContent.includes("ShopFlow DZ")) return;

      const container = title.parentElement;
      if (!container) return;

      if (container.querySelector(".sf-brand-header, .sf-brand-header-mini")) return;

      const isHeader = Boolean(title.closest("header"));
      const brand = document.createElement("div");
      brand.className = isHeader ? "sf-brand-header-mini" : "sf-brand-header";
      brand.innerHTML = isHeader
        ? `<img src="${LOGO_URL}" alt="ShopFlow DZ" />`
        : `<img src="${LOGO_URL}" alt="ShopFlow DZ" /><p>Gère tes commandes, tes clientes, ton succès.</p>`;

      container.insertBefore(brand, title);
      title.classList.add("sf-hidden-old-logo");

      if (!isHeader) {
        const possibleOldLogo = container.querySelector(".w-20.h-20");
        if (possibleOldLogo) possibleOldLogo.classList.add("sf-hidden-old-logo");
      }
    });
  }

  function upgradeCards() {
    document.querySelectorAll(".bg-slate-900.text-white.rounded-3xl").forEach((card) => {
      card.classList.add("sf-card-glow");
    });
  }

  function boot() {
    addControls();
    addInstagramButton();
    upgradeLogo();
    upgradeCards();
    applyTheme();
    applyLang();
  }

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(boot);
  });

  window.addEventListener("DOMContentLoaded", () => {
    boot();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
