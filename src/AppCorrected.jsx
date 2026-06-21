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
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const STATUSES = ["Nouvelle", "En attente paiement", "Confirmée", "Commandée fournisseur", "Reçue", "En livraison", "Livrée", "Annulée", "Retour"];
const DELIVERY_STATUSES = ["Confirmée", "Commandée fournisseur", "Reçue", "En livraison", "Livrée", "Retour"];
const CATEGORIES = ["Publicité", "Livraison", "Emballage", "Outils", "Frais plateforme", "Autre"];

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

const EMPTY_EXPENSE = { label: "", amount: "", category: "Publicité", note: "" };
const EMPTY_CONTACT = { name: "", phone: "", message: "" };

const TR = {
  fr: {
    login: "Connexion",
    register: "Créer un compte",
    email: "Email",
    password: "Mot de passe",
    forgot: "Mot de passe oublié ?",
    resetHelp: "Recevoir un lien de réinitialisation par email",
    shopName: "Nom de boutique",
    saveShop: "Enregistrer la boutique",
    connect: "Se connecter",
    create: "Créer mon compte",
    logout: "Sortir",
    welcome: "Bienvenue sur ShopFlow DZ",
    subtitle: "Une vraie application pour gérer commandes, acomptes, livraison, clientes, charges et rapports.",
    dashboard: "Accueil",
    add: "Ajouter",
    orders: "Commandes",
    reports: "Rapports",
    more: "Plus",
    payments: "Paiements",
    delivery: "Livraison",
    clients: "Clientes",
    expenses: "Charges",
    profile: "Profil boutique",
    contact: "Contact",
    search: "Recherche",
    filter: "Filtre",
    all: "Tout",
    allStatuses: "Tous les statuts",
    allCategories: "Toutes les catégories",
    due: "À encaisser",
    paid: "Soldées",
    unpaid: "Non soldées",
    customer: "Cliente",
    phone: "Téléphone",
    product: "Produit",
    selling: "Prix vente",
    purchase: "Prix achat",
    deposit: "Acompte",
    remaining: "Reste",
    status: "Statut",
    company: "Société livraison",
    tracking: "Code suivi",
    note: "Remarque",
    save: "Enregistrer",
    update: "Modifier",
    cancel: "Annuler",
    delete: "Supprimer",
    whatsapp: "WhatsApp",
    addOrder: "Ajouter une commande",
    editOrder: "Modifier la commande",
    addExpense: "Ajouter une charge",
    editExpense: "Modifier la charge",
    expenseName: "Nom de la charge",
    amount: "Montant",
    category: "Catégorie",
    sales: "Chiffre d'affaires",
    gross: "Bénéfice brut",
    net: "Bénéfice net",
    active: "Commandes actives",
    noResults: "Aucun résultat.",
    noData: "Pas encore de données.",
    savedShop: "Nom de boutique enregistré.",
    resetSent: "Email de réinitialisation envoyé.",
    contactSent: "Message enregistré.",
    name: "Nom",
    message: "Message",
    send: "Envoyer",
    links: "Liens utiles",
    beta: "Centre beta",
    guide: "Guide",
    faq: "FAQ",
    privacy: "Confidentialité",
    terms: "Conditions",
    pricing: "Tarifs",
    roadmap: "Roadmap",
    today: "Aujourd'hui",
    week: "7 jours",
    month: "Ce mois",
    allPeriod: "Tout",
    topProducts: "Produits les plus vendus",
    topClients: "Meilleures clientes",
    byStatus: "Répartition par statut",
    byCategory: "Charges par catégorie",
  },
  ar: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    resetHelp: "إرسال رابط إعادة التعيين عبر البريد",
    shopName: "اسم المتجر",
    saveShop: "حفظ المتجر",
    connect: "دخول",
    create: "إنشاء الحساب",
    logout: "خروج",
    welcome: "مرحبا بك في ShopFlow DZ",
    subtitle: "تطبيق حقيقي لتسيير الطلبات، العربون، التوصيل، الزبائن، المصاريف والتقارير.",
    dashboard: "الرئيسية",
    add: "إضافة",
    orders: "الطلبات",
    reports: "التقارير",
    more: "المزيد",
    payments: "الدفع",
    delivery: "التوصيل",
    clients: "الزبائن",
    expenses: "المصاريف",
    profile: "ملف المتجر",
    contact: "تواصل",
    search: "بحث",
    filter: "فلتر",
    all: "الكل",
    allStatuses: "كل الحالات",
    allCategories: "كل الفئات",
    due: "للتحصيل",
    paid: "مدفوعة",
    unpaid: "غير مدفوعة",
    customer: "الزبونة",
    phone: "الهاتف",
    product: "المنتج",
    selling: "سعر البيع",
    purchase: "سعر الشراء",
    deposit: "العربون",
    remaining: "الباقي",
    status: "الحالة",
    company: "شركة التوصيل",
    tracking: "كود التتبع",
    note: "ملاحظة",
    save: "حفظ",
    update: "تعديل",
    cancel: "إلغاء",
    delete: "حذف",
    whatsapp: "واتساب",
    addOrder: "إضافة طلب",
    editOrder: "تعديل الطلب",
    addExpense: "إضافة مصروف",
    editExpense: "تعديل المصروف",
    expenseName: "اسم المصروف",
    amount: "المبلغ",
    category: "الفئة",
    sales: "رقم الأعمال",
    gross: "الربح الخام",
    net: "الربح الصافي",
    active: "طلبات نشطة",
    noResults: "لا توجد نتائج.",
    noData: "لا توجد بيانات بعد.",
    savedShop: "تم حفظ اسم المتجر.",
    resetSent: "تم إرسال رابط إعادة التعيين.",
    contactSent: "تم حفظ الرسالة.",
    name: "الاسم",
    message: "الرسالة",
    send: "إرسال",
    links: "روابط مهمة",
    beta: "مركز البيتا",
    guide: "الدليل",
    faq: "الأسئلة",
    privacy: "الخصوصية",
    terms: "الشروط",
    pricing: "الأسعار",
    roadmap: "الخطة",
    today: "اليوم",
    week: "7 أيام",
    month: "هذا الشهر",
    allPeriod: "الكل",
    topProducts: "المنتجات الأكثر مبيعا",
    topClients: "أفضل الزبائن",
    byStatus: "حسب الحالة",
    byCategory: "المصاريف حسب الفئة",
  },
};

const statusAr = {
  "Nouvelle": "جديدة",
  "En attente paiement": "في انتظار الدفع",
  "Confirmée": "مؤكدة",
  "Commandée fournisseur": "تم طلبها",
  "Reçue": "وصلت",
  "En livraison": "قيد التوصيل",
  "Livrée": "تم التوصيل",
  "Annulée": "ملغاة",
  "Retour": "مرتجعة",
};

const categoryAr = {
  "Publicité": "إعلانات",
  "Livraison": "توصيل",
  "Emballage": "تغليف",
  "Outils": "أدوات",
  "Frais plateforme": "مصاريف منصة",
  "Autre": "أخرى",
};

function useStored(key, fallback) {
  const [value, setValue] = useState(() => localStorage.getItem(key) || fallback);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue];
}

export default function AppCorrected() {
  const [lang, setLang] = useStored("shopflow-lang", "fr");
  const [theme, setTheme] = useStored("shopflow-theme", "light");
  const [page, setPage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useStored("shopflow-shop-name", "");
  const [records, setRecords] = useState([]);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [period, setPeriod] = useStored("shopflow-period", "month");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const t = TR[lang];
  const dark = theme === "night";
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.style.background = dark ? "#07142B" : "#F5F8FC";
  }, [lang, dir, dark]);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return undefined;
    }
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    return onSnapshot(q, (snap) => {
      const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecords(rows);
    });
  }, [user]);

  const orders = useMemo(() => records.filter((r) => !r.recordType || r.recordType === "order"), [records]);
  const expenses = useMemo(() => records.filter((r) => r.recordType === "expense"), [records]);
  const profile = useMemo(() => records.find((r) => r.recordType === "profile"), [records]);
  const clients = useMemo(() => buildClients(orders), [orders]);
  const stats = useMemo(() => calcStats(orders, expenses), [orders, expenses]);
  const report = useMemo(() => buildReport(orders, expenses, period), [orders, expenses, period]);
  const currentShop = profile?.shopName || shopName || "Ma boutique";

  useEffect(() => {
    if (profile?.shopName) setShopName(profile.shopName);
  }, [profile?.shopName, setShopName]);

  async function register(e) {
    e.preventDefault();
    setMessage("");
    if (!shopName.trim()) return setMessage("Ajoute le nom de ta boutique.");
    if (password.length < 6) return setMessage("Le mot de passe doit contenir au moins 6 caractères.");
    try {
      setLoading(true);
      const created = await createUserWithEmailAndPassword(auth, email.trim(), password);
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setMessage("Connexion réussie.");
    } catch {
      setMessage("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(targetEmail = email || user?.email || "") {
    setMessage("");
    if (!targetEmail.trim()) return setMessage("Ajoute ton email d'abord.");
    try {
      await sendPasswordResetEmail(auth, targetEmail.trim());
      setMessage(t.resetSent);
    } catch {
      setMessage("Impossible d'envoyer l'email pour le moment.");
    }
  }

  async function logout() {
    await signOut(auth);
    setPage("dashboard");
    setPassword("");
  }

  function validateOrder(form) {
    if (!form.customerName.trim()) return "Ajoute le nom de la cliente.";
    if (!form.productName.trim()) return "Ajoute le produit.";
    const phoneDigits = String(form.customerPhone || "").replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 9) return "Téléphone trop court.";
    const selling = Number(form.sellingPrice || 0);
    const purchase = Number(form.purchasePrice || 0);
    const deposit = Number(form.deposit || 0);
    if (!Number.isFinite(selling) || selling <= 0) return "Prix de vente invalide.";
    if (!Number.isFinite(purchase) || purchase < 0) return "Prix d'achat invalide.";
    if (!Number.isFinite(deposit) || deposit < 0) return "Acompte invalide.";
    if (deposit > selling) return "L'acompte ne peut pas dépasser le prix de vente.";
    if (purchase > selling && !window.confirm("Le prix d'achat dépasse le prix de vente. Continuer ?")) return "Commande non enregistrée.";
    return "";
  }

  async function addOrder(e) {
    e.preventDefault();
    const error = validateOrder(orderForm);
    if (error) return setMessage(error);
    const selling = Number(orderForm.sellingPrice || 0);
    const purchase = Number(orderForm.purchasePrice || 0);
    const deposit = Number(orderForm.deposit || 0);
    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), {
        recordType: "order",
        userId: user.uid,
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        productName: orderForm.productName.trim(),
        sellingPrice: selling,
        purchasePrice: purchase,
        deposit,
        remaining: selling - deposit,
        profit: selling - purchase,
        status: orderForm.status,
        deliveryCompany: orderForm.deliveryCompany.trim(),
        trackingCode: orderForm.trackingCode.trim(),
        note: orderForm.note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setOrderForm(EMPTY_ORDER);
      setMessage("Commande ajoutée.");
    } catch {
      setMessage("Erreur ajout commande.");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(order, form) {
    const error = validateOrder(form);
    if (error) return setMessage(error);
    const selling = Number(form.sellingPrice || 0);
    const purchase = Number(form.purchasePrice || 0);
    const deposit = Number(form.deposit || 0);
    await updateDoc(doc(db, "orders", order.id), {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      productName: form.productName.trim(),
      sellingPrice: selling,
      purchasePrice: purchase,
      deposit,
      remaining: selling - deposit,
      profit: selling - purchase,
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
    setMessage("Statut modifié.");
  }

  async function deleteOrder(order) {
    if (!window.confirm("Supprimer cette commande ?")) return;
    await deleteDoc(doc(db, "orders", order.id));
    setMessage("Commande supprimée.");
  }

  async function updatePayment(order, deposit) {
    const value = Number(deposit || 0);
    if (value < 0 || value > Number(order.sellingPrice || 0)) return setMessage("Montant invalide.");
    await updateDoc(doc(db, "orders", order.id), {
      deposit: value,
      remaining: Number(order.sellingPrice || 0) - value,
      updatedAt: serverTimestamp(),
    });
    setMessage("Paiement modifié.");
  }

  async function updateDelivery(order, data) {
    await updateDoc(doc(db, "orders", order.id), {
      status: data.status,
      deliveryCompany: data.deliveryCompany.trim(),
      trackingCode: data.trackingCode.trim(),
      updatedAt: serverTimestamp(),
    });
    setMessage("Livraison modifiée.");
  }

  function validateExpense(form) {
    if (!form.label.trim()) return "Ajoute le nom de la charge.";
    if (Number(form.amount || 0) <= 0) return "Montant invalide.";
    return "";
  }

  async function addExpense(e) {
    e.preventDefault();
    const error = validateExpense(expenseForm);
    if (error) return setMessage(error);
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
    setShopName(clean);
    setMessage(t.savedShop);
  }

  async function saveContact(e) {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.message.trim()) return setMessage("Ajoute ton nom et ton message.");
    await addDoc(collection(db, "orders"), {
      recordType: "contact",
      userId: user.uid,
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      message: contactForm.message.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setContactForm(EMPTY_CONTACT);
    setMessage(t.contactSent);
  }

  const appClass = dark ? "min-h-screen bg-[#07142B] text-white pb-28" : "min-h-screen bg-[#F5F8FC] text-slate-950 pb-28";

  if (!user) {
    return (
      <main dir={dir} className={appClass}>
        <div className="mx-auto max-w-md px-5 py-8">
          <Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
          <section className={card(dark, "mt-5 text-center")}>
            <img src="/shopflow-logo.svg" alt="ShopFlow DZ" className="mx-auto mb-5 w-52" />
            <h1 className="text-2xl font-black">{t.welcome}</h1>
            <p className={muted(dark, "mt-2 text-sm")}>{t.subtitle}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/70 p-1">
              <button type="button" onClick={() => setAuthMode("login")} className={tab(authMode === "login", dark)}>{t.login}</button>
              <button type="button" onClick={() => setAuthMode("register")} className={tab(authMode === "register", dark)}>{t.register}</button>
            </div>
            <form onSubmit={authMode === "login" ? login : register} className="mt-5 space-y-3 text-start">
              {authMode === "register" && <Field label={t.shopName} value={shopName} onChange={(e) => setShopName(e.target.value)} dark={dark} />}
              <Field label={t.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} dark={dark} />
              <Field label={t.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} dark={dark} />
              {authMode === "login" && (
                <button type="button" onClick={() => resetPassword(email)} className="w-full rounded-2xl border-2 border-[#00C4B4] bg-cyan-50 px-4 py-3 text-sm font-black text-[#07142B]">
                  {t.forgot}<br /><span className="text-xs font-semibold">{t.resetHelp}</span>
                </button>
              )}
              <button disabled={loading} className="primary-btn w-full">{loading ? "..." : authMode === "login" ? t.connect : t.create}</button>
            </form>
            <Notice message={message} dark={dark} />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main dir={dir} className={appClass}>
      <header className={dark ? "sticky top-0 z-20 border-b border-white/10 bg-[#07142B]/95 backdrop-blur" : "sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{currentShop}</p>
            <p className={muted(dark, "truncate text-[11px]")}>ShopFlow DZ</p>
          </div>
          <Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} small />
          <button type="button" onClick={logout} className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{t.logout}</button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-5">
        <Notice message={message} dark={dark} />
        {page === "dashboard" && <Dashboard stats={stats} setPage={setPage} t={t} dark={dark} currentShop={currentShop} />}
        {page === "add" && <AddOrder form={orderForm} setForm={setOrderForm} submit={addOrder} loading={loading} t={t} dark={dark} lang={lang} />}
        {page === "orders" && <Orders orders={orders} updateOrder={updateOrder} updateStatus={updateStatus} deleteOrder={deleteOrder} t={t} dark={dark} lang={lang} />}
        {page === "payments" && <Payments orders={orders} updatePayment={updatePayment} t={t} dark={dark} />}
        {page === "delivery" && <Delivery orders={orders} updateDelivery={updateDelivery} t={t} dark={dark} lang={lang} />}
        {page === "expenses" && <Expenses expenses={expenses} form={expenseForm} setForm={setExpenseForm} submit={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense} loading={loading} t={t} dark={dark} lang={lang} />}
        {page === "clients" && <Clients clients={clients} t={t} dark={dark} />}
        {page === "reports" && <Reports report={report} period={period} setPeriod={setPeriod} t={t} dark={dark} lang={lang} />}
        {page === "more" && <More t={t} dark={dark} setPage={setPage} profile={profile} shopName={shopName} setShopName={setShopName} saveProfile={saveProfile} contactForm={contactForm} setContactForm={setContactForm} saveContact={saveContact} resetPassword={() => resetPassword(user.email)} />}
      </div>
      <a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className="fixed bottom-24 right-4 z-30 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-3 text-sm font-black text-[#07142B] shadow-xl">Instagram</a>
      <Nav page={page} setPage={setPage} t={t} dark={dark} />
    </main>
  );
}

function Dashboard({ stats, setPage, t, dark, currentShop }) {
  const shortcuts = [["expenses", t.expenses], ["payments", t.payments], ["delivery", t.delivery], ["clients", t.clients], ["reports", t.reports], ["more", t.profile]];
  return (
    <section className="space-y-4">
      <div className={card(dark)}>
        <p className={muted(dark, "text-sm")}>{currentShop}</p>
        <h2 className="mt-1 text-3xl font-black">{t.dashboard}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label={t.sales} value={money(stats.sales)} dark={dark} />
          <Stat label={t.net} value={money(stats.net)} dark={dark} hot />
          <Stat label={t.remaining} value={money(stats.remaining)} dark={dark} />
          <Stat label={t.expenses} value={money(stats.charges)} dark={dark} />
        </div>
      </div>
      <div className={card(dark)}>
        <h3 className="text-xl font-black">{t.links}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {shortcuts.map(([key, label]) => <button key={key} type="button" onClick={() => setPage(key)} className={linkBoxClass(dark)}>{label}</button>)}
        </div>
      </div>
    </section>
  );
}

function AddOrder({ form, setForm, submit, loading, t, dark, lang }) {
  const set = (key, value) => setForm({ ...form, [key]: value });
  return <section className={card(dark)}><Title title={t.addOrder} dark={dark} /><form onSubmit={submit} className="mt-4 space-y-3"><OrderFields form={form} set={set} t={t} dark={dark} lang={lang} /><button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button></form></section>;
}

function OrderFields({ form, set, t, dark, lang }) {
  return <>
    <Field label={t.customer} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} dark={dark} />
    <Field label={t.phone} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} dark={dark} />
    <Field label={t.product} value={form.productName} onChange={(e) => set("productName", e.target.value)} dark={dark} />
    <div className="grid grid-cols-2 gap-3"><Field label={t.selling} type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} dark={dark} /><Field label={t.purchase} type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} dark={dark} /></div>
    <Field label={t.deposit} type="number" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} dark={dark} />
    <Select label={t.status} value={form.status} onChange={(e) => set("status", e.target.value)} options={STATUSES} dark={dark} optionLabel={(s) => labelStatus(s, lang)} />
    <div className="grid grid-cols-2 gap-3"><Field label={t.company} value={form.deliveryCompany} onChange={(e) => set("deliveryCompany", e.target.value)} dark={dark} /><Field label={t.tracking} value={form.trackingCode} onChange={(e) => set("trackingCode", e.target.value)} dark={dark} /></div>
    <Field label={t.note} value={form.note} onChange={(e) => set("note", e.target.value)} dark={dark} />
  </>;
}

function Orders({ orders, updateOrder, updateStatus, deleteOrder, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const shown = orders.filter((order) => searchText(order, ["customerName", "customerPhone", "productName", "trackingCode", "deliveryCompany"]).includes(q.toLowerCase()) && (status === "all" || (order.status || "Nouvelle") === status));
  return <section className="space-y-3"><Title title={t.orders} dark={dark} /><FilterBar q={q} setQ={setQ} dark={dark} t={t} /><Select label={t.status} value={status} onChange={(e) => setStatus(e.target.value)} options={["all", ...STATUSES]} dark={dark} optionLabel={(s) => s === "all" ? t.allStatuses : labelStatus(s, lang)} />{shown.length === 0 && <Empty text={t.noResults} dark={dark} />}{shown.map((order) => <OrderCard key={order.id} order={order} updateOrder={updateOrder} updateStatus={updateStatus} deleteOrder={deleteOrder} t={t} dark={dark} lang={lang} />)}</section>;
}

function OrderCard({ order, updateOrder, updateStatus, deleteOrder, t, dark, lang }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(orderToForm(order));
  useEffect(() => setForm(orderToForm(order)), [order]);
  const set = (key, value) => setForm({ ...form, [key]: value });
  return <article className={card(dark)}>{!editing ? <>
    <div className="flex justify-between gap-3"><div><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p></div><span className="h-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">{labelStatus(order.status || "Nouvelle", lang)}</span></div>
    <div className="mt-4 grid grid-cols-3 gap-2"><Mini label={t.selling} value={money(order.sellingPrice)} dark={dark} /><Mini label={t.deposit} value={money(order.deposit)} dark={dark} /><Mini label={t.remaining} value={money(order.remaining)} dark={dark} /></div>
    <Select label={t.status} value={order.status || "Nouvelle"} onChange={(e) => updateStatus(order, e.target.value)} options={STATUSES} dark={dark} optionLabel={(s) => labelStatus(s, lang)} />
    <div className="mt-3 grid grid-cols-3 gap-2"><a href={wa(order.customerPhone, `Bonjour ${order.customerName}, concernant votre commande ${order.productName}.`)} target="_blank" rel="noreferrer" className="rounded-2xl bg-green-50 px-3 py-3 text-center text-xs font-black text-green-700">{t.whatsapp}</a><button type="button" onClick={() => setEditing(true)} className="rounded-2xl bg-cyan-50 px-3 py-3 text-xs font-black text-cyan-700">{t.update}</button><button type="button" onClick={() => deleteOrder(order)} className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-red-600">{t.delete}</button></div>
  </> : <div className="space-y-3"><h3 className="text-xl font-black">{t.editOrder}</h3><OrderFields form={form} set={set} t={t} dark={dark} lang={lang} /><div className="grid grid-cols-2 gap-2"><button type="button" onClick={async () => { await updateOrder(order, form); setEditing(false); }} className="primary-btn">{t.save}</button><button type="button" onClick={() => setEditing(false)} className={secondaryBtn(dark)}>{t.cancel}</button></div></div>}</article>;
}

function Payments({ orders, updatePayment, t, dark }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("due");
  const shown = activeOrders(orders).filter((order) => {
    const due = Number(order.sellingPrice || 0) - Number(order.deposit || 0);
    return searchText(order, ["customerName", "customerPhone", "productName"]).includes(q.toLowerCase()) && (filter === "all" || (filter === "due" ? due > 0 : due <= 0));
  });
  return <section className="space-y-3"><Title title={t.payments} dark={dark} /><FilterBar q={q} setQ={setQ} dark={dark} t={t} /><Select label={t.filter} value={filter} onChange={(e) => setFilter(e.target.value)} options={["all", "due", "paid"]} dark={dark} optionLabel={(x) => x === "all" ? t.all : x === "due" ? t.due : t.paid} />{shown.length === 0 && <Empty text={t.noResults} dark={dark} />}{shown.map((order) => <Payment key={order.id} order={order} updatePayment={updatePayment} t={t} dark={dark} />)}</section>;
}

function Payment({ order, updatePayment, t, dark }) {
  const [deposit, setDeposit] = useState(order.deposit || 0);
  useEffect(() => setDeposit(order.deposit || 0), [order.deposit]);
  return <article className={card(dark)}><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p><div className="mt-4 grid grid-cols-2 gap-3"><Field label={t.deposit} type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} dark={dark} /><Mini label={t.remaining} value={money(Number(order.sellingPrice || 0) - Number(deposit || 0))} dark={dark} /></div><button type="button" onClick={() => updatePayment(order, deposit)} className="primary-btn mt-3 w-full">{t.save}</button></article>;
}

function Delivery({ orders, updateDelivery, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const shown = orders.filter((order) => searchText(order, ["customerName", "customerPhone", "productName", "trackingCode", "deliveryCompany"]).includes(q.toLowerCase()) && (status === "all" || (order.status || "Nouvelle") === status));
  return <section className="space-y-3"><Title title={t.delivery} dark={dark} /><FilterBar q={q} setQ={setQ} dark={dark} t={t} /><Select label={t.status} value={status} onChange={(e) => setStatus(e.target.value)} options={["all", ...DELIVERY_STATUSES]} dark={dark} optionLabel={(s) => s === "all" ? t.allStatuses : labelStatus(s, lang)} />{shown.length === 0 && <Empty text={t.noResults} dark={dark} />}{shown.map((order) => <DeliveryCard key={order.id} order={order} updateDelivery={updateDelivery} t={t} dark={dark} lang={lang} />)}</section>;
}

function DeliveryCard({ order, updateDelivery, t, dark, lang }) {
  const [form, setForm] = useState({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" });
  useEffect(() => setForm({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" }), [order]);
  return <article className={card(dark)}><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p><Select label={t.status} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={DELIVERY_STATUSES} dark={dark} optionLabel={(s) => labelStatus(s, lang)} /><Field label={t.company} value={form.deliveryCompany} onChange={(e) => setForm({ ...form, deliveryCompany: e.target.value })} dark={dark} /><Field label={t.tracking} value={form.trackingCode} onChange={(e) => setForm({ ...form, trackingCode: e.target.value })} dark={dark} /><button type="button" onClick={() => updateDelivery(order, form)} className="primary-btn mt-3 w-full">{t.save}</button></article>;
}

function Expenses({ expenses, form, setForm, submit, updateExpense, deleteExpense, loading, t, dark, lang }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const set = (key, value) => setForm({ ...form, [key]: value });
  const shown = expenses.filter((expense) => searchText(expense, ["label", "category", "note"]).includes(q.toLowerCase()) && (category === "all" || expense.category === category));
  return <section className="space-y-3"><Title title={t.expenses} dark={dark} /><article className={card(dark)}><h3 className="text-xl font-black">{t.addExpense}</h3><form onSubmit={submit} className="mt-4 space-y-3"><ExpenseFields form={form} set={set} t={t} dark={dark} lang={lang} /><button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button></form></article><FilterBar q={q} setQ={setQ} dark={dark} t={t} /><Select label={t.category} value={category} onChange={(e) => setCategory(e.target.value)} options={["all", ...CATEGORIES]} dark={dark} optionLabel={(c) => c === "all" ? t.allCategories : labelCategory(c, lang)} />{shown.length === 0 && <Empty text={t.noResults} dark={dark} />}{shown.map((expense) => <ExpenseCard key={expense.id} expense={expense} updateExpense={updateExpense} deleteExpense={deleteExpense} t={t} dark={dark} lang={lang} />)}</section>;
}

function ExpenseCard({ expense, updateExpense, deleteExpense, t, dark, lang }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(expenseToForm(expense));
  useEffect(() => setForm(expenseToForm(expense)), [expense]);
  const set = (key, value) => setForm({ ...form, [key]: value });
  return <article className={card(dark)}>{!editing ? <><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{expense.label}</h3><p className={muted(dark, "text-sm")}>{labelCategory(expense.category, lang)}</p></div><strong>{money(expense.amount)}</strong></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditing(true)} className="rounded-2xl bg-cyan-50 px-3 py-3 text-xs font-black text-cyan-700">{t.editExpense}</button><button type="button" onClick={() => deleteExpense(expense)} className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-red-600">{t.delete}</button></div></> : <div className="space-y-3"><h3 className="text-xl font-black">{t.editExpense}</h3><ExpenseFields form={form} set={set} t={t} dark={dark} lang={lang} /><div className="grid grid-cols-2 gap-2"><button type="button" onClick={async () => { await updateExpense(expense, form); setEditing(false); }} className="primary-btn">{t.save}</button><button type="button" onClick={() => setEditing(false)} className={secondaryBtn(dark)}>{t.cancel}</button></div></div>}</article>;
}

function ExpenseFields({ form, set, t, dark, lang }) {
  return <><Field label={t.expenseName} value={form.label} onChange={(e) => set("label", e.target.value)} dark={dark} /><Field label={t.amount} type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} dark={dark} /><Select label={t.category} value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES} dark={dark} optionLabel={(c) => labelCategory(c, lang)} /><Field label={t.note} value={form.note} onChange={(e) => set("note", e.target.value)} dark={dark} /></>;
}

function Clients({ clients, t, dark }) {
  const [q, setQ] = useState("");
  const shown = clients.filter((client) => searchText(client, ["name", "phone"]).includes(q.toLowerCase()));
  return <section className="space-y-3"><Title title={t.clients} dark={dark} /><FilterBar q={q} setQ={setQ} dark={dark} t={t} />{shown.length === 0 && <Empty text={t.noResults} dark={dark} />}{shown.map((client) => <article key={client.key} className={card(dark)}><h3 className="font-black">{client.name}</h3><p className={muted(dark, "text-sm")}>{client.phone}</p><div className="mt-4 grid grid-cols-3 gap-2"><Mini label={t.orders} value={client.count} dark={dark} /><Mini label={t.sales} value={money(client.sales)} dark={dark} /><Mini label={t.remaining} value={money(client.remaining)} dark={dark} /></div><a href={wa(client.phone, `Bonjour ${client.name}`)} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl bg-green-50 px-3 py-3 text-center text-xs font-black text-green-700">{t.whatsapp}</a></article>)}</section>;
}

function Reports({ report, period, setPeriod, t, dark, lang }) {
  return <section className="space-y-3"><Title title={t.reports} dark={dark} /><div className="grid grid-cols-4 gap-2">{[["today", t.today], ["week", t.week], ["month", t.month], ["all", t.allPeriod]].map(([key, label]) => <button key={key} onClick={() => setPeriod(key)} className={tab(period === key, dark)}>{label}</button>)}</div><div className={card(dark)}><div className="grid grid-cols-2 gap-3"><Stat label={t.sales} value={money(report.sales)} dark={dark} /><Stat label={t.net} value={money(report.net)} dark={dark} hot /><Stat label={t.expenses} value={money(report.charges)} dark={dark} /><Stat label={t.orders} value={report.count} dark={dark} /></div></div><ReportList title={t.topProducts} rows={report.products} dark={dark} /><ReportList title={t.topClients} rows={report.clients} dark={dark} /><ReportList title={t.byStatus} rows={report.statuses.map((x) => ({ ...x, label: labelStatus(x.label, lang) }))} dark={dark} /><ReportList title={t.byCategory} rows={report.categories.map((x) => ({ ...x, label: labelCategory(x.label, lang) }))} dark={dark} /></section>;
}

function More({ t, dark, setPage, profile, shopName, setShopName, saveProfile, contactForm, setContactForm, saveContact, resetPassword }) {
  const links = [["/beta.html", t.beta], ["/guide.html", t.guide], ["/faq.html", t.faq], ["/privacy.html", t.privacy], ["/terms.html", t.terms], ["/pricing.html", t.pricing], ["/roadmap.html", t.roadmap]];
  const [profileName, setProfileName] = useState(profile?.shopName || shopName || "");
  useEffect(() => setProfileName(profile?.shopName || shopName || ""), [profile?.shopName, shopName]);
  return <section className="space-y-3"><Title title={t.more} dark={dark} /><article className={card(dark)}><h3 className="text-xl font-black">{t.profile}</h3><p className={muted(dark, "mt-1 text-sm")}>Le header affiche ce nom, pas l'email.</p><Field label={t.shopName} value={profileName} onChange={(e) => setProfileName(e.target.value)} dark={dark} /><button type="button" onClick={() => { setShopName(profileName); saveProfile(profileName); }} className="primary-btn mt-3 w-full">{t.saveShop}</button><button type="button" onClick={resetPassword} className={secondaryBtn(dark, "mt-3 w-full")}>{t.forgot}</button></article><article className={card(dark)}><h3 className="text-xl font-black">{t.links}</h3><div className="mt-4 grid grid-cols-2 gap-3"><button onClick={() => setPage("payments")} className={linkBoxClass(dark)}>{t.payments}</button><button onClick={() => setPage("delivery")} className={linkBoxClass(dark)}>{t.delivery}</button><button onClick={() => setPage("clients")} className={linkBoxClass(dark)}>{t.clients}</button><button onClick={() => setPage("expenses")} className={linkBoxClass(dark)}>{t.expenses}</button>{links.map(([href, label]) => <a key={href} href={href} className={linkBoxClass(dark)}>{label}</a>)}<a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className={linkBoxClass(dark)}>Instagram</a></div></article><article className={card(dark)}><h3 className="text-xl font-black">{t.contact}</h3><form onSubmit={saveContact} className="mt-4 space-y-3"><Field label={t.name} value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} dark={dark} /><Field label={t.phone} value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} dark={dark} /><TextArea label={t.message} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} dark={dark} /><button className="primary-btn w-full">{t.send}</button></form></article></section>;
}

function Nav({ page, setPage, t, dark }) {
  const items = [["dashboard", t.dashboard], ["add", t.add], ["orders", t.orders], ["expenses", t.expenses], ["reports", t.reports], ["more", t.more]];
  return <nav className={dark ? "fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07142B]" : "fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white"}><div className="mx-auto grid max-w-2xl grid-cols-6 gap-1 p-2">{items.map(([key, label]) => <button key={key} onClick={() => setPage(key)} className={page === key ? "rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-1 py-3 text-[10px] font-black text-[#07142B]" : dark ? "rounded-2xl px-1 py-3 text-[10px] font-bold text-slate-300" : "rounded-2xl px-1 py-3 text-[10px] font-bold text-slate-500"}>{label}</button>)}</div></nav>;
}

function Controls({ lang, setLang, theme, setTheme, small = false }) {
  return <div className={`flex ${small ? "gap-1" : "justify-end gap-2"}`}><button type="button" onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="rounded-2xl bg-[#00C4B4] px-3 py-2 text-xs font-black text-[#07142B]">{lang.toUpperCase()}</button><button type="button" onClick={() => setTheme(theme === "light" ? "night" : "light")} className="rounded-2xl bg-[#07142B] px-3 py-2 text-xs font-black text-white">{theme === "light" ? "🌙" : "☀️"}</button></div>;
}

function Field({ label, dark, ...props }) {
  return <label className="block"><span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span><input {...props} className={inputClass(dark)} /></label>;
}

function TextArea({ label, dark, ...props }) {
  return <label className="block"><span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span><textarea {...props} rows="4" className={inputClass(dark)} /></label>;
}

function Select({ label, options, optionLabel, dark, ...props }) {
  return <label className="block"><span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span><select {...props} className={inputClass(dark)}>{options.map((option) => <option key={option} value={option}>{optionLabel ? optionLabel(option) : option}</option>)}</select></label>;
}

function FilterBar({ q, setQ, dark, t }) {
  return <article className={card(dark, "space-y-2")}><h3 className="text-sm font-black">{t.search} + {t.filter}</h3><Field label={t.search} value={q} onChange={(e) => setQ(e.target.value)} dark={dark} /></article>;
}

function Title({ title, dark }) {
  return <div><h2 className="text-2xl font-black">{title}</h2><div className={dark ? "mt-2 h-1 w-16 rounded-full bg-[#00E5FF]" : "mt-2 h-1 w-16 rounded-full bg-[#00C4B4]"} /></div>;
}

function Notice({ message, dark }) {
  if (!message) return null;
  return <div className={dark ? "mb-4 rounded-2xl bg-white/10 p-3 text-sm font-bold text-white" : "mb-4 rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-[#07142B]"}>{message}</div>;
}

function Empty({ text, dark }) {
  return <div className={card(dark, "text-center text-sm font-bold")}>{text}</div>;
}

function Stat({ label, value, dark, hot = false }) {
  return <div className={hot ? "rounded-3xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] p-4 text-[#07142B]" : dark ? "rounded-3xl bg-white/10 p-4" : "rounded-3xl bg-slate-50 p-4"}><p className="text-xs font-bold opacity-70">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>;
}

function Mini({ label, value, dark }) {
  return <div className={dark ? "rounded-2xl bg-white/10 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className="text-[10px] font-bold opacity-70">{label}</p><p className="text-sm font-black">{value}</p></div>;
}

function ReportList({ title, rows, dark }) {
  return <article className={card(dark)}><h3 className="text-lg font-black">{title}</h3>{rows.length === 0 ? <p className={muted(dark, "mt-3 text-sm")}>—</p> : <div className="mt-3 space-y-2">{rows.map((row) => <div key={row.label} className="flex justify-between gap-3 text-sm"><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>}</article>;
}

function card(dark, extra = "") {
  return `${dark ? "rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-xl" : "rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl"} ${extra}`;
}

function inputClass(dark) {
  return dark ? "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-300" : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none";
}

function muted(dark, extra = "") {
  return `${dark ? "text-slate-300" : "text-slate-500"} ${extra}`;
}

function tab(active, dark) {
  if (active) return "rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-3 py-2 text-xs font-black text-[#07142B]";
  return dark ? "rounded-2xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-300" : "rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-600";
}

function secondaryBtn(dark, extra = "") {
  return `${dark ? "rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white" : "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#07142B]"} ${extra}`;
}

function linkBoxClass(dark) {
  return dark ? "rounded-3xl border border-white/10 bg-white/10 p-4 text-center text-sm font-black text-white" : "rounded-3xl border border-slate-100 bg-slate-50 p-4 text-center text-sm font-black text-[#07142B]";
}

function money(value) {
  return `${Math.round(Number(value || 0)).toLocaleString("fr-FR")} DA`;
}

function labelStatus(status, lang) {
  return lang === "ar" ? statusAr[status] || status : status;
}

function labelCategory(category, lang) {
  return lang === "ar" ? categoryAr[category] || category : category;
}

function activeOrders(orders) {
  return orders.filter((order) => !["Annulée", "Retour"].includes(order.status));
}

function searchText(item, keys) {
  return keys.map((key) => item[key] || "").join(" ").toLowerCase();
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

function expenseToForm(expense) {
  return { label: expense.label || "", amount: expense.amount ?? "", category: expense.category || "Publicité", note: expense.note || "" };
}

function wa(phone, text) {
  const digits = String(phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `213${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function buildClients(orders) {
  const map = new Map();
  for (const order of orders) {
    const key = order.customerPhone || order.customerName || order.id;
    const current = map.get(key) || { key, name: order.customerName || "Cliente", phone: order.customerPhone || "", count: 0, sales: 0, remaining: 0 };
    current.count += 1;
    if (!["Annulée", "Retour"].includes(order.status)) {
      current.sales += Number(order.sellingPrice || 0);
      current.remaining += Number(order.remaining || 0);
    }
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.sales - a.sales);
}

function calcStats(orders, expenses) {
  const active = activeOrders(orders);
  const sales = active.reduce((sum, order) => sum + Number(order.sellingPrice || 0), 0);
  const purchases = active.reduce((sum, order) => sum + Number(order.purchasePrice || 0), 0);
  const deposits = active.reduce((sum, order) => sum + Number(order.deposit || 0), 0);
  const charges = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  return { sales, charges, remaining: sales - deposits, gross: sales - purchases, net: sales - purchases - charges, active: active.length };
}

function inPeriod(item, period) {
  if (period === "all") return true;
  const seconds = item.createdAt?.seconds;
  if (!seconds) return true;
  const date = new Date(seconds * 1000);
  const now = new Date();
  if (period === "today") return date.toDateString() === now.toDateString();
  if (period === "week") return now - date <= 7 * 24 * 60 * 60 * 1000;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function buildReport(orders, expenses, period) {
  const filteredOrders = activeOrders(orders).filter((order) => inPeriod(order, period));
  const filteredExpenses = expenses.filter((expense) => inPeriod(expense, period));
  const stats = calcStats(filteredOrders, filteredExpenses);
  return {
    ...stats,
    count: filteredOrders.length,
    products: countRows(filteredOrders, "productName"),
    clients: countRows(filteredOrders, "customerName"),
    statuses: countRows(filteredOrders, "status"),
    categories: countRows(filteredExpenses, "category", true),
  };
}

function countRows(items, key, moneyValue = false) {
  const map = new Map();
  for (const item of items) {
    const label = item[key] || "—";
    const add = moneyValue ? Number(item.amount || 0) : 1;
    map.set(label, (map.get(label) || 0) + add);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value: moneyValue ? money(value) : value }));
}
