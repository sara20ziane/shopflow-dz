import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const STATUSES = [
  "Nouvelle",
  "En attente paiement",
  "Confirmée",
  "Commandée fournisseur",
  "Reçue",
  "En livraison",
  "Livrée",
  "Annulée",
  "Retour",
];

const DELIVERY_STATUSES = [
  "Confirmée",
  "Commandée fournisseur",
  "Reçue",
  "En livraison",
  "Livrée",
  "Retour",
];

const EXPENSE_CATEGORIES = [
  "Publicité",
  "Livraison",
  "Emballage",
  "Outils",
  "Frais plateforme",
  "Autre",
];

const PERIODS = ["today", "week", "month", "all"];

const EMPTY_ORDER = {
  customerName: "",
  customerPhone: "",
  productName: "",
  sellingPrice: "",
  purchasePrice: "",
  deposit: "",
  status: "Nouvelle",
  deliveryCompany: "",
  trackingCode: "",
  note: "",
};

const EMPTY_EXPENSE = {
  label: "",
  amount: "",
  category: "Publicité",
  note: "",
};

const EMPTY_CONTACT = {
  name: "",
  phone: "",
  message: "",
};

const text = {
  fr: {
    login: "Connexion",
    register: "Créer un compte",
    email: "Email",
    password: "Mot de passe",
    shopName: "Nom de boutique",
    connect: "Se connecter",
    create: "Créer mon compte",
    logout: "Sortir",
    forgot: "Mot de passe oublié ?",
    welcome: "Bienvenue sur ShopFlow DZ",
    subtitle: "Gère tes commandes, acomptes, livraisons, clientes, charges et rapports depuis ton téléphone.",
    dashboard: "Accueil",
    add: "Ajouter",
    orders: "Commandes",
    payments: "Paiements",
    delivery: "Livraison",
    clients: "Clientes",
    expenses: "Charges",
    reports: "Rapports",
    more: "Plus",
    sales: "Chiffre d'affaires",
    gross: "Bénéfice brut",
    net: "Bénéfice net",
    remaining: "À encaisser",
    active: "Actives",
    ready: "Prêtes",
    customer: "Cliente",
    phone: "Téléphone",
    product: "Produit",
    selling: "Prix vente",
    purchase: "Prix achat",
    deposit: "Acompte",
    status: "Statut",
    company: "Société livraison",
    tracking: "Code suivi",
    note: "Remarque",
    save: "Enregistrer",
    update: "Modifier",
    cancel: "Annuler",
    edit: "Éditer",
    del: "Supprimer",
    search: "Rechercher",
    all: "Tout",
    allStatuses: "Tous les statuts",
    allCategories: "Toutes les catégories",
    addOrder: "Ajouter une commande",
    editOrder: "Modifier la commande",
    addExpense: "Ajouter une charge",
    editExpense: "Modifier la charge",
    expenseName: "Nom de la charge",
    amount: "Montant",
    category: "Catégorie",
    beta: "Centre beta",
    guide: "Guide",
    faq: "FAQ",
    privacy: "Confidentialité",
    terms: "Conditions beta",
    pricing: "Tarifs",
    roadmap: "Roadmap",
    contact: "Contact",
    instagram: "Instagram",
    contactHelp: "Remplis le formulaire, il sera enregistré dans ShopFlow DZ. Tu peux aussi contacter Instagram.",
    sendContact: "Envoyer le contact",
    profile: "Profil boutique",
    saveProfile: "Enregistrer la boutique",
    tools: "Outils",
    today: "Aujourd'hui",
    week: "Cette semaine",
    month: "Ce mois",
    period: "Période",
    topProducts: "Produits les plus vendus",
    topClients: "Meilleures clientes",
    byStatus: "Répartition par statut",
    byCategory: "Charges par catégorie",
    noData: "Pas encore de données pour cette période.",
    ordersCount: "Commandes",
    reportsIntro: "Analyse rapidement ce qui se vend, ce qui reste à encaisser et quelles charges pèsent sur ton bénéfice net.",
    noResults: "Aucun résultat.",
    due: "À encaisser",
    paid: "Soldées",
    unpaid: "Non soldées",
    contactSent: "Message enregistré. Tu peux aussi nous écrire sur Instagram.",
    profileSaved: "Nom de boutique enregistré.",
    resetSent: "Email de réinitialisation envoyé.",
  },
  ar: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    shopName: "اسم المتجر",
    connect: "دخول",
    create: "إنشاء الحساب",
    logout: "خروج",
    forgot: "نسيت كلمة المرور؟",
    welcome: "مرحبا بك في ShopFlow DZ",
    subtitle: "سيّري الطلبات، العربون، التوصيل، الزبائن، المصاريف والتقارير من الهاتف.",
    dashboard: "الرئيسية",
    add: "إضافة",
    orders: "الطلبات",
    payments: "الدفع",
    delivery: "التوصيل",
    clients: "الزبائن",
    expenses: "المصاريف",
    reports: "التقارير",
    more: "المزيد",
    sales: "رقم الأعمال",
    gross: "الربح الخام",
    net: "الربح الصافي",
    remaining: "المتبقي للتحصيل",
    active: "نشطة",
    ready: "جاهزة",
    customer: "الزبونة",
    phone: "الهاتف",
    product: "المنتج",
    selling: "سعر البيع",
    purchase: "سعر الشراء",
    deposit: "العربون",
    status: "الحالة",
    company: "شركة التوصيل",
    tracking: "كود التتبع",
    note: "ملاحظة",
    save: "حفظ",
    update: "تعديل",
    cancel: "إلغاء",
    edit: "تعديل",
    del: "حذف",
    search: "بحث",
    all: "الكل",
    allStatuses: "كل الحالات",
    allCategories: "كل الفئات",
    addOrder: "إضافة طلب",
    editOrder: "تعديل الطلب",
    addExpense: "إضافة مصروف",
    editExpense: "تعديل المصروف",
    expenseName: "اسم المصروف",
    amount: "المبلغ",
    category: "الفئة",
    beta: "مركز البيتا",
    guide: "الدليل",
    faq: "الأسئلة",
    privacy: "الخصوصية",
    terms: "شروط البيتا",
    pricing: "الأسعار",
    roadmap: "الخطة",
    contact: "تواصل",
    instagram: "إنستغرام",
    contactHelp: "املئي الاستمارة وسيتم حفظ الرسالة في ShopFlow DZ. يمكنك أيضا مراسلتنا في إنستغرام.",
    sendContact: "إرسال الرسالة",
    profile: "ملف المتجر",
    saveProfile: "حفظ اسم المتجر",
    tools: "الأدوات",
    today: "اليوم",
    week: "هذا الأسبوع",
    month: "هذا الشهر",
    period: "الفترة",
    topProducts: "المنتجات الأكثر مبيعا",
    topClients: "أفضل الزبونات",
    byStatus: "حسب الحالة",
    byCategory: "المصاريف حسب الفئة",
    noData: "لا توجد بيانات لهذه الفترة بعد.",
    ordersCount: "طلبات",
    reportsIntro: "حللي بسرعة ما يُباع، ما تبقى للتحصيل، والمصاريف التي تؤثر على الربح الصافي.",
    noResults: "لا توجد نتائج.",
    due: "للتحصيل",
    paid: "مدفوعة",
    unpaid: "غير مدفوعة",
    contactSent: "تم حفظ الرسالة. يمكنك أيضا مراسلتنا عبر إنستغرام.",
    profileSaved: "تم حفظ اسم المتجر.",
    resetSent: "تم إرسال رسالة إعادة تعيين كلمة المرور.",
  },
};

const statusLabels = {
  fr: Object.fromEntries(STATUSES.map((s) => [s, s])),
  ar: {
    "Nouvelle": "جديدة",
    "En attente paiement": "في انتظار الدفع",
    "Confirmée": "مؤكدة",
    "Commandée fournisseur": "تم طلبها من المورد",
    "Reçue": "وصلت",
    "En livraison": "قيد التوصيل",
    "Livrée": "تم التوصيل",
    "Annulée": "ملغاة",
    "Retour": "مرتجعة",
  },
};

const categoryLabels = {
  fr: Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, c])),
  ar: {
    "Publicité": "إعلانات",
    "Livraison": "توصيل",
    "Emballage": "تغليف",
    "Outils": "أدوات",
    "Frais plateforme": "مصاريف منصة",
    "Autre": "أخرى",
  },
};

function stored(key, fallback) {
  const [value, setValue] = useState(() => localStorage.getItem(key) || fallback);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue];
}

export default function AppBetaFixes() {
  const [lang, setLang] = stored("shopflow-lang", "fr");
  const [theme, setTheme] = stored("shopflow-theme", "light");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState([]);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [period, setPeriod] = stored("shopflow-report-period", "month");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const t = text[lang];
  const dark = theme === "night";
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.style.background = dark ? "#07142B" : "#F5F8FC";
  }, [dir, lang, dark]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecords(rows);
    });
  }, [user]);

  const orders = useMemo(
    () => records.filter((item) => !item.recordType || item.recordType === "order"),
    [records]
  );
  const expenses = useMemo(
    () => records.filter((item) => item.recordType === "expense"),
    [records]
  );
  const profile = useMemo(
    () => records.find((item) => item.recordType === "profile"),
    [records]
  );
  const clients = useMemo(() => buildClients(orders), [orders]);
  const stats = useMemo(() => calculateStats(orders, expenses), [orders, expenses]);
  const reports = useMemo(() => buildReports(orders, expenses, period), [orders, expenses, period]);

  async function register(e) {
    e.preventDefault();
    setMessage("");
    if (!shopName.trim()) return setMessage("Ajoute le nom de ta boutique.");
    if (password.length < 6) return setMessage("Le mot de passe doit contenir au moins 6 caractères.");

    try {
      setLoading(true);
      const created = await createUserWithEmailAndPassword(auth, email, password);
      await addDoc(collection(db, "orders"), {
        recordType: "profile",
        userId: created.user.uid,
        shopName: shopName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage("Compte créé.");
    } catch (error) {
      setMessage(error.code === "auth/email-already-in-use" ? "Cet email est déjà utilisé." : "Erreur création compte.");
    } finally {
      setLoading(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setMessage("");
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Connexion réussie.");
    } catch {
      setMessage("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setMessage("");
    if (!email.trim()) return setMessage("Ajoute ton email puis clique encore.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage(t.resetSent);
    } catch {
      setMessage("Impossible d'envoyer l'email pour le moment.");
    }
  }

  async function logout() {
    await signOut(auth);
    setEmail("");
    setPassword("");
    setShopName("");
    setPage("dashboard");
  }

  function validateOrder(form) {
    if (!form.customerName.trim()) return "Ajoute le nom de la cliente.";
    if (!form.productName.trim()) return "Ajoute le nom du produit.";

    const phoneDigits = String(form.customerPhone || "").replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 9) return "Le numéro de téléphone semble trop court.";

    const sellingPrice = Number(form.sellingPrice || 0);
    const purchasePrice = Number(form.purchasePrice || 0);
    const deposit = Number(form.deposit || 0);

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) return "Ajoute un prix de vente valide.";
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return "Le prix d'achat doit être positif.";
    if (!Number.isFinite(deposit) || deposit < 0) return "L'acompte doit être positif.";
    if (deposit > sellingPrice) return "L'acompte ne peut pas dépasser le prix de vente.";

    if (purchasePrice > sellingPrice) {
      const ok = window.confirm("Le prix d'achat dépasse le prix de vente. Continuer quand même ?");
      if (!ok) return "Commande non enregistrée.";
    }

    return "";
  }

  async function addOrder(e) {
    e.preventDefault();
    setMessage("");
    const error = validateOrder(orderForm);
    if (error) return setMessage(error);

    const sellingPrice = Number(orderForm.sellingPrice || 0);
    const purchasePrice = Number(orderForm.purchasePrice || 0);
    const deposit = Number(orderForm.deposit || 0);

    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), {
        recordType: "order",
        userId: user.uid,
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        productName: orderForm.productName.trim(),
        sellingPrice,
        purchasePrice,
        deposit,
        remaining: sellingPrice - deposit,
        profit: sellingPrice - purchasePrice,
        status: orderForm.status,
        deliveryCompany: orderForm.deliveryCompany.trim(),
        trackingCode: orderForm.trackingCode.trim(),
        note: orderForm.note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOrderForm(EMPTY_ORDER);
      setMessage("Commande ajoutée.");
      setPage("orders");
    } catch {
      setMessage("Erreur ajout commande.");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(order, form) {
    setMessage("");
    const error = validateOrder(form);
    if (error) return setMessage(error);

    const sellingPrice = Number(form.sellingPrice || 0);
    const purchasePrice = Number(form.purchasePrice || 0);
    const deposit = Number(form.deposit || 0);

    await updateDoc(doc(db, "orders", order.id), {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      productName: form.productName.trim(),
      sellingPrice,
      purchasePrice,
      deposit,
      remaining: sellingPrice - deposit,
      profit: sellingPrice - purchasePrice,
      status: form.status,
      deliveryCompany: form.deliveryCompany.trim(),
      trackingCode: form.trackingCode.trim(),
      note: form.note.trim(),
      updatedAt: serverTimestamp(),
    });
    setMessage("Commande modifiée.");
  }

  async function updateStatus(order, status) {
    await updateDoc(doc(db, "orders", order.id), { status, updatedAt: serverTimestamp() });
    setMessage("Statut mis à jour.");
  }

  async function updatePayment(order, deposit) {
    const value = Number(deposit || 0);
    if (value < 0 || value > Number(order.sellingPrice || 0)) return setMessage("Montant invalide.");
    await updateDoc(doc(db, "orders", order.id), {
      deposit: value,
      remaining: Number(order.sellingPrice || 0) - value,
      updatedAt: serverTimestamp(),
    });
    setMessage("Paiement mis à jour.");
  }

  async function updateDelivery(order, data) {
    await updateDoc(doc(db, "orders", order.id), {
      status: data.status,
      deliveryCompany: data.deliveryCompany.trim(),
      trackingCode: data.trackingCode.trim(),
      updatedAt: serverTimestamp(),
    });
    setMessage("Livraison mise à jour.");
  }

  async function deleteOrder(order) {
    if (!window.confirm("Supprimer cette commande ?")) return;
    await deleteDoc(doc(db, "orders", order.id));
    setMessage("Commande supprimée.");
  }

  function validateExpense(form) {
    if (!form.label.trim()) return "Ajoute le nom de la charge.";
    const amount = Number(form.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return "Ajoute un montant valide.";
    return "";
  }

  async function addExpense(e) {
    e.preventDefault();
    setMessage("");
    const error = validateExpense(expenseForm);
    if (error) return setMessage(error);

    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), {
        recordType: "expense",
        userId: user.uid,
        label: expenseForm.label.trim(),
        amount: Number(expenseForm.amount || 0),
        category: expenseForm.category,
        note: expenseForm.note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setExpenseForm(EMPTY_EXPENSE);
      setMessage("Charge ajoutée.");
    } catch {
      setMessage("Erreur ajout charge.");
    } finally {
      setLoading(false);
    }
  }

  async function updateExpense(expense, form) {
    const error = validateExpense(form);
    if (error) return setMessage(error);
    await updateDoc(doc(db, "orders", expense.id), {
      label: form.label.trim(),
      amount: Number(form.amount || 0),
      category: form.category,
      note: form.note.trim(),
      updatedAt: serverTimestamp(),
    });
    setMessage("Charge modifiée.");
  }

  async function deleteExpense(expense) {
    if (!window.confirm("Supprimer cette charge ?")) return;
    await deleteDoc(doc(db, "orders", expense.id));
    setMessage("Charge supprimée.");
  }

  async function saveProfile(value) {
    const clean = value.trim();
    if (!clean) return setMessage("Ajoute le nom de ta boutique.");
    if (profile?.id) {
      await updateDoc(doc(db, "orders", profile.id), { shopName: clean, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "orders"), {
        recordType: "profile",
        userId: user.uid,
        shopName: clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    setMessage(t.profileSaved);
  }

  async function saveContact(form) {
    if (!form.name.trim() || !form.message.trim()) return setMessage("Ajoute ton nom et ton message.");
    await addDoc(collection(db, "orders"), {
      recordType: "contact",
      userId: user.uid,
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setMessage(t.contactSent);
  }

  const appClass = dark ? "min-h-screen bg-[#07142B] text-white pb-28" : "min-h-screen bg-[#F5F8FC] text-slate-950 pb-28";
  const currentShopName = profile?.shopName || shopName || "ShopFlow DZ";

  if (!user) {
    return (
      <main dir={dir} className={appClass}>
        <div className="mx-auto max-w-md px-5 py-8">
          <Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
          <section className={card(dark, "mt-6 text-center")}>
            <img src="/shopflow-logo.svg" alt="ShopFlow DZ" className="mx-auto mb-5 w-56" />
            <h1 className="text-2xl font-black">{t.welcome}</h1>
            <p className={muted(dark, "mt-2 text-sm")}>{t.subtitle}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/70 p-1">
              <button onClick={() => setAuthMode("login")} className={tab(authMode === "login", dark)}>{t.login}</button>
              <button onClick={() => setAuthMode("register")} className={tab(authMode === "register", dark)}>{t.register}</button>
            </div>

            <form onSubmit={authMode === "login" ? login : register} className="mt-5 space-y-3 text-start">
              {authMode === "register" && <Field label={t.shopName} value={shopName} onChange={(e) => setShopName(e.target.value)} dark={dark} />}
              <Field label={t.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dark={dark} />
              <Field label={t.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} dark={dark} />
              <button disabled={loading} className="primary-btn w-full">{loading ? "..." : authMode === "login" ? t.connect : t.create}</button>
            </form>

            {authMode === "login" && (
              <button onClick={resetPassword} className={dark ? "mt-3 text-sm font-bold text-cyan-200" : "mt-3 text-sm font-bold text-cyan-700"}>{t.forgot}</button>
            )}
            <Notice message={message} dark={dark} />
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <LinkBox href="/beta.html" title={t.beta} dark={dark} />
            <LinkBox href="/guide.html" title={t.guide} dark={dark} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir={dir} className={appClass}>
      <header className={dark ? "sticky top-0 z-20 border-b border-white/10 bg-[#07142B]/95 backdrop-blur" : "sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <img src="/shopflow-logo.svg" alt="ShopFlow DZ" className="w-28" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black">{currentShopName}</p>
            <p className={muted(dark, "truncate text-[11px]")}>{user.email}</p>
          </div>
          <Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} small />
          <button onClick={logout} className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{t.logout}</button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        <Notice message={message} dark={dark} />
        {page === "dashboard" && <Dashboard stats={stats} setPage={setPage} t={t} dark={dark} />}
        {page === "add" && <AddOrder form={orderForm} setForm={setOrderForm} submit={addOrder} loading={loading} t={t} dark={dark} lang={lang} />}
        {page === "orders" && <Orders orders={orders} updateOrder={updateOrder} updateStatus={updateStatus} deleteOrder={deleteOrder} t={t} dark={dark} lang={lang} />}
        {page === "payments" && <Payments orders={orders} updatePayment={updatePayment} t={t} dark={dark} />}
        {page === "delivery" && <Delivery orders={orders} updateDelivery={updateDelivery} t={t} dark={dark} lang={lang} />}
        {page === "expenses" && <Expenses expenses={expenses} form={expenseForm} setForm={setExpenseForm} submit={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense} loading={loading} t={t} dark={dark} lang={lang} />}
        {page === "reports" && <Reports reports={reports} period={period} setPeriod={setPeriod} t={t} dark={dark} />}
        {page === "clients" && <Clients clients={clients} t={t} dark={dark} />}
        {page === "more" && <More t={t} dark={dark} setPage={setPage} profile={profile} saveProfile={saveProfile} saveContact={saveContact} />}
      </div>

      <a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className="fixed bottom-24 right-4 z-30 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-3 text-sm font-black text-[#07142B] shadow-xl">Instagram</a>
      <Nav page={page} setPage={setPage} t={t} dark={dark} />
    </main>
  );
}

function Dashboard({ stats, setPage, t, dark }) {
  return (
    <section className="space-y-4">
      <div className={card(dark)}>
        <p className={muted(dark, "text-sm")}>ShopFlow DZ</p>
        <h2 className="mt-1 text-3xl font-black">{t.dashboard}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label={t.sales} value={money(stats.sales)} dark={dark} />
          <Stat label={t.net} value={money(stats.net)} dark={dark} hot />
          <Stat label={t.remaining} value={money(stats.remaining)} dark={dark} />
          <Stat label={t.active} value={stats.active} dark={dark} />
          <Stat label={t.expenses} value={money(stats.charges)} dark={dark} />
          <Stat label={t.ready} value={stats.ready} dark={dark} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Quick onClick={() => setPage("add")} label={t.addOrder} />
        <Quick onClick={() => setPage("orders")} label={t.orders} />
        <Quick onClick={() => setPage("reports")} label={t.reports} />
        <Quick onClick={() => setPage("more")} label={t.tools} />
      </div>
    </section>
  );
}

function AddOrder({ form, setForm, submit, loading, t, dark, lang }) {
  const set = (key, value) => setForm({ ...form, [key]: value });
  return (
    <section className={card(dark)}>
      <h2 className="text-2xl font-black">{t.addOrder}</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <OrderFields form={form} set={set} t={t} dark={dark} lang={lang} />
        <button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button>
      </form>
    </section>
  );
}

function OrderFields({ form, set, t, dark, lang }) {
  return (
    <>
      <Field label={t.customer} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} dark={dark} />
      <Field label={t.phone} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} dark={dark} />
      <Field label={t.product} value={form.productName} onChange={(e) => set("productName", e.target.value)} dark={dark} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.selling} type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} dark={dark} />
        <Field label={t.purchase} type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} dark={dark} />
      </div>
      <Field label={t.deposit} type="number" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} dark={dark} />
      <Select label={t.status} value={form.status} onChange={(e) => set("status", e.target.value)} options={STATUSES} dark={dark} optionLabel={(status) => labelStatus(status, lang)} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.company} value={form.deliveryCompany} onChange={(e) => set("deliveryCompany", e.target.value)} dark={dark} />
        <Field label={t.tracking} value={form.trackingCode} onChange={(e) => set("trackingCode", e.target.value)} dark={dark} />
      </div>
      <Field label={t.note} value={form.note} onChange={(e) => set("note", e.target.value)} dark={dark} />
    </>
  );
}

function Orders({ orders, updateOrder, updateStatus, deleteOrder, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const shown = orders.filter((order) => {
    const matchesText = `${order.customerName} ${order.customerPhone} ${order.productName} ${order.trackingCode}`.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = status === "all" || (order.status || "Nouvelle") === status;
    return matchesText && matchesStatus;
  });

  return (
    <section className="space-y-3">
      <Title title={t.orders} dark={dark} />
      <Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} />
      <Select label={t.status} value={status} onChange={(e) => setStatus(e.target.value)} options={["all", ...STATUSES]} dark={dark} optionLabel={(item) => item === "all" ? t.allStatuses : labelStatus(item, lang)} />
      {shown.length === 0 && <Empty text={t.noResults} dark={dark} />}
      {shown.map((order) => <OrderCard key={order.id} order={order} updateOrder={updateOrder} updateStatus={updateStatus} deleteOrder={deleteOrder} t={t} dark={dark} lang={lang} />)}
    </section>
  );
}

function OrderCard({ order, updateOrder, updateStatus, deleteOrder, t, dark, lang }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(orderToForm(order));
  useEffect(() => setForm(orderToForm(order)), [order]);
  const set = (key, value) => setForm({ ...form, [key]: value });

  return (
    <article className={card(dark)}>
      {!editing ? (
        <>
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="font-black">{order.customerName}</h3>
              <p className={muted(dark, "text-sm")}>{order.productName}</p>
            </div>
            <span className="h-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">{labelStatus(order.status || "Nouvelle", lang)}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Mini label={t.selling} value={money(order.sellingPrice)} dark={dark} />
            <Mini label={t.deposit} value={money(order.deposit)} dark={dark} />
            <Mini label={t.remaining} value={money(order.remaining)} dark={dark} />
          </div>
          <select value={order.status || "Nouvelle"} onChange={(e) => updateStatus(order, e.target.value)} className={`${field(dark)} mt-4`}>
            {STATUSES.map((item) => <option key={item} value={item}>{labelStatus(item, lang)}</option>)}
          </select>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <a href={wa(order.customerPhone, `Bonjour ${order.customerName}, concernant votre commande ${order.productName}.`)} target="_blank" rel="noreferrer" className="rounded-2xl bg-green-50 px-3 py-3 text-center text-xs font-black text-green-700">WhatsApp</a>
            <button onClick={() => setEditing(true)} className="rounded-2xl bg-cyan-50 px-3 py-3 text-xs font-black text-cyan-700">{t.edit}</button>
            <button onClick={() => deleteOrder(order)} className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-red-600">{t.del}</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xl font-black">{t.editOrder}</h3>
          <OrderFields form={form} set={set} t={t} dark={dark} lang={lang} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={async () => { await updateOrder(order, form); setEditing(false); }} className="primary-btn">{t.update}</button>
            <button onClick={() => { setForm(orderToForm(order)); setEditing(false); }} className={secondaryBtn(dark)}>{t.cancel}</button>
          </div>
        </div>
      )}
    </article>
  );
}

function Payments({ orders, updatePayment, t, dark }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("due");
  const shown = activeOrders(orders).filter((order) => {
    const remaining = Number(order.sellingPrice || 0) - Number(order.deposit || 0);
    const matchesText = `${order.customerName} ${order.customerPhone} ${order.productName}`.toLowerCase().includes(q.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "due" ? remaining > 0 : remaining <= 0);
    return matchesText && matchesFilter;
  });

  return (
    <section className="space-y-3">
      <Title title={t.payments} dark={dark} />
      <Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} />
      <Select label={t.status} value={filter} onChange={(e) => setFilter(e.target.value)} options={["all", "due", "paid"]} dark={dark} optionLabel={(item) => item === "all" ? t.all : item === "due" ? t.due : t.paid} />
      {shown.length === 0 && <Empty text={t.noResults} dark={dark} />}
      {shown.map((order) => <Payment key={order.id} order={order} updatePayment={updatePayment} t={t} dark={dark} />)}
    </section>
  );
}

function Payment({ order, updatePayment, t, dark }) {
  const [deposit, setDeposit] = useState(order.deposit || 0);
  useEffect(() => setDeposit(order.deposit || 0), [order.deposit]);
  return (
    <article className={card(dark)}>
      <h3 className="font-black">{order.customerName}</h3>
      <p className={muted(dark, "text-sm")}>{order.productName}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={t.deposit} type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} dark={dark} />
        <Mini label={t.remaining} value={money(Number(order.sellingPrice || 0) - Number(deposit || 0))} dark={dark} />
      </div>
      <button onClick={() => updatePayment(order, deposit)} className="primary-btn mt-3 w-full">{t.update}</button>
    </article>
  );
}

function Delivery({ orders, updateDelivery, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const shown = orders.filter((order) => order.status !== "Nouvelle" && order.status !== "Annulée").filter((order) => {
    const matchesText = `${order.customerName} ${order.phone} ${order.productName} ${order.deliveryCompany} ${order.trackingCode}`.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = status === "all" || (order.status || "Confirmée") === status;
    return matchesText && matchesStatus;
  });
  return (
    <section className="space-y-3">
      <Title title={t.delivery} dark={dark} />
      <Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} />
      <Select label={t.status} value={status} onChange={(e) => setStatus(e.target.value)} options={["all", ...DELIVERY_STATUSES]} dark={dark} optionLabel={(item) => item === "all" ? t.allStatuses : labelStatus(item, lang)} />
      {shown.length === 0 && <Empty text={t.noResults} dark={dark} />}
      {shown.map((order) => <DeliveryItem key={order.id} order={order} updateDelivery={updateDelivery} t={t} dark={dark} lang={lang} />)}
    </section>
  );
}

function DeliveryItem({ order, updateDelivery, t, dark, lang }) {
  const [form, setForm] = useState({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" });
  useEffect(() => setForm({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" }), [order]);
  return (
    <article className={card(dark)}>
      <h3 className="font-black">{order.customerName}</h3>
      <p className={muted(dark, "text-sm")}>{order.productName}</p>
      <div className="mt-4 space-y-3">
        <Select label={t.status} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={DELIVERY_STATUSES} dark={dark} optionLabel={(item) => labelStatus(item, lang)} />
        <Field label={t.company} value={form.deliveryCompany} onChange={(e) => setForm({ ...form, deliveryCompany: e.target.value })} dark={dark} />
        <Field label={t.tracking} value={form.trackingCode} onChange={(e) => setForm({ ...form, trackingCode: e.target.value })} dark={dark} />
        <button onClick={() => updateDelivery(order, form)} className="primary-btn w-full">{t.update}</button>
      </div>
    </article>
  );
}

function Expenses({ expenses, form, setForm, submit, updateExpense, deleteExpense, loading, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const set = (key, value) => setForm({ ...form, [key]: value });
  const shown = expenses.filter((expense) => {
    const matchesText = `${expense.label} ${expense.category} ${expense.note}`.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = category === "all" || expense.category === category;
    return matchesText && matchesCategory;
  });
  return (
    <section className="space-y-4">
      <div className={card(dark)}>
        <h2 className="text-2xl font-black">{t.expenses}</h2>
        <p className={muted(dark, "mt-1 text-sm")}>{money(sum(expenses, "amount"))}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <ExpenseFields form={form} set={set} t={t} dark={dark} lang={lang} />
          <button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button>
        </form>
      </div>
      <Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} />
      <Select label={t.category} value={category} onChange={(e) => setCategory(e.target.value)} options={["all", ...EXPENSE_CATEGORIES]} dark={dark} optionLabel={(item) => item === "all" ? t.allCategories : labelCategory(item, lang)} />
      {shown.length === 0 && <Empty text={t.noResults} dark={dark} />}
      {shown.map((expense) => <ExpenseCard key={expense.id} expense={expense} updateExpense={updateExpense} deleteExpense={deleteExpense} t={t} dark={dark} lang={lang} />)}
    </section>
  );
}

function ExpenseFields({ form, set, t, dark, lang }) {
  return (
    <>
      <Field label={t.expenseName} value={form.label} onChange={(e) => set("label", e.target.value)} dark={dark} />
      <Field label={t.amount} type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} dark={dark} />
      <Select label={t.category} value={form.category} onChange={(e) => set("category", e.target.value)} options={EXPENSE_CATEGORIES} dark={dark} optionLabel={(item) => labelCategory(item, lang)} />
      <Field label={t.note} value={form.note} onChange={(e) => set("note", e.target.value)} dark={dark} />
    </>
  );
}

function ExpenseCard({ expense, updateExpense, deleteExpense, t, dark, lang }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ label: expense.label || "", amount: expense.amount || "", category: expense.category || "Publicité", note: expense.note || "" });
  useEffect(() => setForm({ label: expense.label || "", amount: expense.amount || "", category: expense.category || "Publicité", note: expense.note || "" }), [expense]);
  const set = (key, value) => setForm({ ...form, [key]: value });
  return (
    <article className={card(dark)}>
      {!editing ? (
        <>
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="font-black">{expense.label}</h3>
              <p className={muted(dark, "text-sm")}>{labelCategory(expense.category, lang)}</p>
            </div>
            <strong>{money(expense.amount)}</strong>
          </div>
          {expense.note && <p className={muted(dark, "mt-2 text-sm")}>{expense.note}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setEditing(true)} className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-black text-cyan-700">{t.edit}</button>
            <button onClick={() => deleteExpense(expense)} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">{t.del}</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xl font-black">{t.editExpense}</h3>
          <ExpenseFields form={form} set={set} t={t} dark={dark} lang={lang} />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={async () => { await updateExpense(expense, form); setEditing(false); }} className="primary-btn">{t.update}</button>
            <button onClick={() => setEditing(false)} className={secondaryBtn(dark)}>{t.cancel}</button>
          </div>
        </div>
      )}
    </article>
  );
}

function Reports({ reports, period, setPeriod, t, dark }) {
  return (
    <section className="space-y-4">
      <div className={card(dark)}>
        <p className={muted(dark, "text-sm")}>ShopFlow DZ</p>
        <h2 className="mt-1 text-3xl font-black">{t.reports}</h2>
        <p className={muted(dark, "mt-2 text-sm")}>{t.reportsIntro}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PERIODS.map((item) => <button key={item} onClick={() => setPeriod(item)} className={period === item ? "rounded-2xl bg-[#07142B] px-2 py-3 text-xs font-black text-white" : dark ? "rounded-2xl bg-white/5 px-2 py-3 text-xs font-bold text-slate-300" : "rounded-2xl bg-slate-100 px-2 py-3 text-xs font-bold text-slate-600"}>{t[item]}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t.sales} value={money(reports.sales)} dark={dark} />
        <Stat label={t.net} value={money(reports.net)} dark={dark} hot />
        <Stat label={t.expenses} value={money(reports.charges)} dark={dark} />
        <Stat label={t.ordersCount} value={reports.ordersCount} dark={dark} />
      </div>
      <ReportList title={t.topProducts} items={reports.topProducts} dark={dark} empty={t.noData} />
      <ReportList title={t.topClients} items={reports.topClients} dark={dark} empty={t.noData} />
      <ReportList title={t.byStatus} items={reports.statusRows} dark={dark} empty={t.noData} />
      <ReportList title={t.byCategory} items={reports.expenseRows} dark={dark} empty={t.noData} />
    </section>
  );
}

function ReportList({ title, items, dark, empty }) {
  return (
    <div className={card(dark)}>
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 && <p className={muted(dark, "text-sm")}>{empty}</p>}
        {items.map((item) => (
          <div key={item.label} className={dark ? "rounded-2xl bg-white/5 p-3" : "rounded-2xl bg-slate-50 p-3"}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-black">{item.label}</p>
                {item.meta && <p className={muted(dark, "text-xs")}>{item.meta}</p>}
              </div>
              <strong className="text-sm">{item.value}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Clients({ clients, t, dark }) {
  const [q, setQ] = useState("");
  const shown = clients.filter((client) => `${client.name} ${client.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="space-y-3">
      <Title title={t.clients} dark={dark} />
      <Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} />
      {shown.length === 0 && <Empty text={t.noResults} dark={dark} />}
      {shown.map((client) => (
        <article key={client.id} className={card(dark)}>
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="font-black">{client.name}</h3>
              <p className={muted(dark, "text-sm")}>{client.phone || "Sans téléphone"}</p>
            </div>
            <strong>{client.totalOrders}</strong>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Mini label={t.sales} value={money(client.totalSpent)} dark={dark} />
            <Mini label={t.deposit} value={money(client.totalDeposits)} dark={dark} />
            <Mini label={t.remaining} value={money(client.totalRemaining)} dark={dark} />
          </div>
          {client.phone && <a href={wa(client.phone, `Bonjour ${client.name}, c'est ShopFlow DZ.`)} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">WhatsApp</a>}
        </article>
      ))}
    </section>
  );
}

function More({ t, dark, setPage, profile, saveProfile, saveContact }) {
  const [shop, setShop] = useState(profile?.shopName || "");
  const [contact, setContact] = useState(EMPTY_CONTACT);
  useEffect(() => setShop(profile?.shopName || ""), [profile]);

  return (
    <section className="space-y-4">
      <div className={card(dark)}>
        <h2 className="text-2xl font-black">{t.tools}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => setPage("payments")} className={linkBoxClass(dark)}>{t.payments}</button>
          <button onClick={() => setPage("delivery")} className={linkBoxClass(dark)}>{t.delivery}</button>
          <button onClick={() => setPage("expenses")} className={linkBoxClass(dark)}>{t.expenses}</button>
          <button onClick={() => setPage("clients")} className={linkBoxClass(dark)}>{t.clients}</button>
        </div>
      </div>

      <div className={card(dark)}>
        <h2 className="text-2xl font-black">{t.profile}</h2>
        <div className="mt-4 space-y-3">
          <Field label={t.shopName} value={shop} onChange={(e) => setShop(e.target.value)} dark={dark} />
          <button onClick={() => saveProfile(shop)} className="primary-btn w-full">{t.saveProfile}</button>
        </div>
      </div>

      <div className={card(dark)}>
        <h2 className="text-2xl font-black">{t.more}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <LinkBox href="/beta.html" title={t.beta} dark={dark} />
          <LinkBox href="/guide.html" title={t.guide} dark={dark} />
          <LinkBox href="/faq.html" title={t.faq} dark={dark} />
          <LinkBox href="/privacy.html" title={t.privacy} dark={dark} />
          <LinkBox href="/terms.html" title={t.terms} dark={dark} />
          <LinkBox href="/pricing.html" title={t.pricing} dark={dark} />
          <LinkBox href="/roadmap.html" title={t.roadmap} dark={dark} />
          <LinkBox href="https://www.instagram.com/shopflowdz/" title={t.instagram} dark={dark} />
        </div>
      </div>

      <div className={card(dark)}>
        <h2 className="text-2xl font-black">{t.contact}</h2>
        <p className={muted(dark, "mt-1 text-sm")}>{t.contactHelp}</p>
        <div className="mt-4 space-y-3">
          <Field label={t.customer} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} dark={dark} />
          <Field label={t.phone} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} dark={dark} />
          <Field label="Message" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} dark={dark} />
          <button onClick={async () => { await saveContact(contact); setContact(EMPTY_CONTACT); }} className="primary-btn w-full">{t.sendContact}</button>
          <a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className={secondaryBtn(dark)}>{t.instagram}</a>
        </div>
      </div>
    </section>
  );
}

function Nav({ page, setPage, t, dark }) {
  const items = [["dashboard", t.dashboard], ["add", t.add], ["orders", t.orders], ["reports", t.reports], ["more", t.more]];
  return (
    <nav className={dark ? "fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#07142B]/95 backdrop-blur" : "fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"}>
      <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2 px-3 py-2">
        {items.map(([key, label]) => <button key={key} onClick={() => setPage(key)} className={page === key ? "rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-2 py-3 text-xs font-black text-[#07142B]" : `rounded-2xl px-2 py-3 text-xs font-bold ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</button>)}
      </div>
    </nav>
  );
}

function Controls({ lang, setLang, theme, setTheme, small }) {
  return (
    <div className={`flex ${small ? "gap-1" : "justify-end gap-2"}`}>
      <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="rounded-full border border-cyan-300/40 bg-white/10 px-3 py-2 text-xs font-black">{lang === "fr" ? "AR" : "FR"}</button>
      <button onClick={() => setTheme(theme === "light" ? "night" : "light")} className="rounded-full border border-cyan-300/40 bg-white/10 px-3 py-2 text-xs font-black">{theme === "light" ? "🌙" : "☀️"}</button>
    </div>
  );
}

function Field({ label, dark, ...props }) {
  return (
    <label className="block">
      <span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span>
      <input {...props} className={field(dark)} />
    </label>
  );
}

function Select({ label, options, optionLabel = (item) => item, dark, ...props }) {
  return (
    <label className="block">
      <span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span>
      <select {...props} className={field(dark)}>
        {options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}
      </select>
    </label>
  );
}

function Title({ title, dark }) {
  return <div className={card(dark)}><h2 className="text-2xl font-black">{title}</h2></div>;
}

function Empty({ text, dark }) {
  return <p className={muted(dark, "rounded-2xl p-4 text-center text-sm")}>{text}</p>;
}

function Stat({ label, value, dark, hot }) {
  return <div className={hot ? "rounded-3xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] p-4 text-[#07142B]" : dark ? "rounded-3xl bg-white/5 p-4" : "rounded-3xl bg-slate-50 p-4"}><p className={`text-xs font-bold ${hot ? "text-[#07142B]/70" : dark ? "text-slate-300" : "text-slate-500"}`}>{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}

function Mini({ label, value, dark }) {
  return <div className={dark ? "rounded-2xl bg-white/5 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className={muted(dark, "text-[11px] font-bold")}>{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function Quick({ label, onClick }) {
  return <button onClick={onClick} className="rounded-3xl bg-[#07142B] p-4 text-left font-black text-white shadow-lg">{label}</button>;
}

function LinkBox({ href, title, dark }) {
  return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={linkBoxClass(dark)}>{title}</a>;
}

function Notice({ message, dark }) {
  if (!message) return null;
  return <p className={dark ? "mt-4 rounded-2xl bg-white/10 p-3 text-sm" : "mt-4 rounded-2xl bg-cyan-50 p-3 text-sm text-cyan-900"}>{message}</p>;
}

function card(dark, extra = "") {
  return `${dark ? "border border-white/10 bg-white/5 shadow-2xl shadow-black/20" : "border border-white bg-white shadow-sm"} rounded-[2rem] p-5 ${extra}`;
}

function muted(dark, extra = "") {
  return `${dark ? "text-slate-300" : "text-slate-500"} ${extra}`;
}

function field(dark) {
  return `w-full rounded-2xl border px-4 py-3 outline-none transition ${dark ? "border-white/10 bg-white/10 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-950"}`;
}

function tab(active, dark) {
  return active ? "rounded-xl bg-[#07142B] px-4 py-3 text-sm font-black text-white" : `rounded-xl px-4 py-3 text-sm font-bold ${dark ? "text-slate-300" : "text-slate-500"}`;
}

function secondaryBtn(dark) {
  return dark ? "block rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white" : "block rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-800";
}

function linkBoxClass(dark) {
  return dark ? "rounded-3xl bg-white/5 p-4 font-black text-white" : "rounded-3xl bg-white p-4 font-black text-slate-900 shadow-sm";
}

function labelStatus(status, lang) {
  return statusLabels[lang]?.[status] || status;
}

function labelCategory(category, lang) {
  return categoryLabels[lang]?.[category] || category;
}

function orderToForm(order) {
  return {
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    productName: order.productName || "",
    sellingPrice: order.sellingPrice ?? "",
    purchasePrice: order.purchasePrice ?? "",
    deposit: order.deposit ?? "",
    status: order.status || "Nouvelle",
    deliveryCompany: order.deliveryCompany || "",
    trackingCode: order.trackingCode || "",
    note: order.note || "",
  };
}

function money(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} DA`;
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
}

function activeOrders(orders) {
  return orders.filter((order) => order.status !== "Annulée" && order.status !== "Retour");
}

function calculateStats(orders, expenses) {
  const active = activeOrders(orders);
  const sales = sum(active, "sellingPrice");
  const purchases = sum(active, "purchasePrice");
  const deposits = sum(active, "deposit");
  const charges = sum(expenses, "amount");
  return { sales, gross: sales - purchases, net: sales - purchases - charges, remaining: sales - deposits, active: active.length, ready: orders.filter((order) => order.status === "Reçue").length, charges };
}

function buildReports(orders, expenses, period) {
  const filteredOrders = activeOrders(orders).filter((order) => inPeriod(order, period));
  const filteredExpenses = expenses.filter((expense) => inPeriod(expense, period));
  const sales = sum(filteredOrders, "sellingPrice");
  const purchases = sum(filteredOrders, "purchasePrice");
  const deposits = sum(filteredOrders, "deposit");
  const charges = sum(filteredExpenses, "amount");
  return {
    sales,
    gross: sales - purchases,
    net: sales - purchases - charges,
    remaining: sales - deposits,
    charges,
    ordersCount: filteredOrders.length,
    topProducts: aggregateRows(filteredOrders, "productName", "Produit", "sellingPrice", true),
    topClients: aggregateRows(filteredOrders, "customerName", "Cliente", "sellingPrice", true),
    statusRows: aggregateRows(filteredOrders, "status", "Statut", "sellingPrice", false),
    expenseRows: aggregateRows(filteredExpenses, "category", "Catégorie", "amount", false),
  };
}

function aggregateRows(items, key, fallback, amountKey, withCount) {
  const map = new Map();
  items.forEach((item) => {
    const label = item[key] || fallback;
    if (!map.has(label)) map.set(label, { label, count: 0, total: 0 });
    const row = map.get(label);
    row.count += 1;
    row.total += Number(item[amountKey] || 0);
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total || b.count - a.count).slice(0, 5).map((row) => ({ label: row.label, meta: withCount ? `${row.count} ${row.count > 1 ? "commandes" : "commande"}` : `${row.count} ligne${row.count > 1 ? "s" : ""}`, value: money(row.total) }));
}

function inPeriod(item, period) {
  if (period === "all") return true;
  const seconds = item.createdAt?.seconds;
  if (!seconds) return false;
  const date = new Date(seconds * 1000);
  const now = new Date();
  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    return date >= start;
  }
  if (period === "week") {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return date >= start;
  }
  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return date >= start;
  }
  return true;
}

function buildClients(orders) {
  const map = new Map();
  orders.forEach((order) => {
    const name = order.customerName || "Cliente sans nom";
    const phone = order.customerPhone || "";
    const key = (phone || name || order.id).trim().toLowerCase();
    const active = order.status !== "Annulée" && order.status !== "Retour";
    if (!map.has(key)) map.set(key, { id: key, name, phone, totalOrders: 0, activeOrders: 0, totalSpent: 0, totalDeposits: 0, totalRemaining: 0 });
    const client = map.get(key);
    client.totalOrders += 1;
    if (active) {
      client.activeOrders += 1;
      client.totalSpent += Number(order.sellingPrice || 0);
      client.totalDeposits += Number(order.deposit || 0);
      client.totalRemaining += Number(order.remaining || 0);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.totalOrders - a.totalOrders);
}

function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return `213${digits.slice(1)}`;
  return digits;
}

function wa(phone, message) {
  const number = waNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "https://wa.me/";
}
