import { useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, onSnapshot, query, where, serverTimestamp, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

const statuses = ["Nouvelle", "En attente paiement", "Confirmée", "Commandée fournisseur", "Reçue", "En livraison", "Livrée", "Annulée", "Retour"];
const deliveryStatuses = ["Confirmée", "Commandée fournisseur", "Reçue", "En livraison", "Livrée", "Retour"];
const expenseCategories = ["Publicité", "Livraison", "Emballage", "Outils", "Frais plateforme", "Autre"];
const emptyOrder = { customerName: "", customerPhone: "", productName: "", sellingPrice: "", purchasePrice: "", deposit: "", status: "Nouvelle", deliveryCompany: "", trackingCode: "", note: "" };
const emptyExpense = { label: "", amount: "", category: "Publicité", note: "" };

const text = {
  fr: { login: "Connexion", register: "Créer un compte", email: "Email", password: "Mot de passe", shopName: "Nom de boutique", connect: "Se connecter", create: "Créer mon compte", logout: "Sortir", welcome: "Bienvenue sur ShopFlow DZ", subtitle: "Gère tes commandes, acomptes, livraisons, clientes et charges depuis ton téléphone.", dashboard: "Accueil", add: "Ajouter", orders: "Commandes", payments: "Paiements", delivery: "Livraison", clients: "Clientes", expenses: "Charges", more: "Plus", sales: "Chiffre d'affaires", gross: "Bénéfice brut", net: "Bénéfice net", remaining: "À encaisser", active: "Actives", ready: "Prêtes", customer: "Cliente", phone: "Téléphone", product: "Produit", selling: "Prix vente", purchase: "Prix achat", deposit: "Acompte", status: "Statut", company: "Société livraison", tracking: "Code suivi", note: "Remarque", save: "Enregistrer", update: "Modifier", del: "Supprimer", search: "Rechercher", addOrder: "Ajouter une commande", addExpense: "Ajouter une charge", expenseName: "Nom de la charge", amount: "Montant", category: "Catégorie", beta: "Centre beta", guide: "Guide", faq: "FAQ", privacy: "Confidentialité", terms: "Conditions beta", contact: "Contact", instagram: "Instagram", contactHelp: "Écris ton message puis contacte ShopFlow DZ sur Instagram." },
  ar: { login: "تسجيل الدخول", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", shopName: "اسم المتجر", connect: "دخول", create: "إنشاء الحساب", logout: "خروج", welcome: "مرحبا بك في ShopFlow DZ", subtitle: "سيّري الطلبات، العربون، التوصيل، الزبائن والمصاريف من الهاتف.", dashboard: "الرئيسية", add: "إضافة", orders: "الطلبات", payments: "الدفع", delivery: "التوصيل", clients: "الزبائن", expenses: "المصاريف", more: "المزيد", sales: "رقم الأعمال", gross: "الربح الخام", net: "الربح الصافي", remaining: "المتبقي", active: "نشطة", ready: "جاهزة", customer: "الزبونة", phone: "الهاتف", product: "المنتج", selling: "سعر البيع", purchase: "سعر الشراء", deposit: "العربون", status: "الحالة", company: "شركة التوصيل", tracking: "كود التتبع", note: "ملاحظة", save: "حفظ", update: "تعديل", del: "حذف", search: "بحث", addOrder: "إضافة طلب", addExpense: "إضافة مصروف", expenseName: "اسم المصروف", amount: "المبلغ", category: "الفئة", beta: "مركز البيتا", guide: "الدليل", faq: "الأسئلة", privacy: "الخصوصية", terms: "شروط البيتا", contact: "تواصل", instagram: "إنستغرام", contactHelp: "اكتبي رسالتك ثم تواصلي مع ShopFlow DZ عبر إنستغرام." }
};

function stored(key, fallback) {
  const [value, setValue] = useState(() => localStorage.getItem(key) || fallback);
  useEffect(() => localStorage.setItem(key, value), [key, value]);
  return [value, setValue];
}

export default function AppRedesign() {
  const [lang, setLang] = stored("shopflow-lang", "fr");
  const [theme, setTheme] = stored("shopflow-theme", "light");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState([]);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
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
    if (!user) { setRecords([]); return; }
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    return onSnapshot(q, snap => {
      const rows = snap.docs.map(item => ({ id: item.id, ...item.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecords(rows);
    });
  }, [user]);

  const orders = useMemo(() => records.filter(item => item.recordType !== "expense"), [records]);
  const expenses = useMemo(() => records.filter(item => item.recordType === "expense"), [records]);
  const clients = useMemo(() => buildClients(orders), [orders]);
  const stats = useMemo(() => {
    const active = orders.filter(o => o.status !== "Annulée" && o.status !== "Retour");
    const sales = sum(active, "sellingPrice");
    const purchases = sum(active, "purchasePrice");
    const deposits = sum(active, "deposit");
    const charges = sum(expenses, "amount");
    return { sales, gross: sales - purchases, net: sales - purchases - charges, remaining: sales - deposits, active: active.length, ready: orders.filter(o => o.status === "Reçue").length, charges };
  }, [orders, expenses]);

  async function register(e) {
    e.preventDefault(); setMessage("");
    if (!shopName.trim()) return setMessage("Ajoute le nom de ta boutique.");
    if (password.length < 6) return setMessage("Le mot de passe doit contenir au moins 6 caractères.");
    try { setLoading(true); await createUserWithEmailAndPassword(auth, email, password); setMessage("Compte créé."); }
    catch (error) { setMessage(error.code === "auth/email-already-in-use" ? "Cet email est déjà utilisé." : "Erreur création compte."); }
    finally { setLoading(false); }
  }

  async function login(e) {
    e.preventDefault(); setMessage("");
    try { setLoading(true); await signInWithEmailAndPassword(auth, email, password); setMessage("Connexion réussie."); }
    catch { setMessage("Email ou mot de passe incorrect."); }
    finally { setLoading(false); }
  }

  async function logout() {
    await signOut(auth); setEmail(""); setPassword(""); setShopName(""); setPage("dashboard");
  }

  async function addOrder(e) {
    e.preventDefault(); setMessage("");
    if (!orderForm.customerName.trim()) return setMessage("Ajoute le nom de la cliente.");
    if (!orderForm.productName.trim()) return setMessage("Ajoute le nom du produit.");
    if (!orderForm.sellingPrice) return setMessage("Ajoute le prix de vente.");
    const sellingPrice = Number(orderForm.sellingPrice || 0);
    const purchasePrice = Number(orderForm.purchasePrice || 0);
    const deposit = Number(orderForm.deposit || 0);
    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), { recordType: "order", userId: user.uid, customerName: orderForm.customerName.trim(), customerPhone: orderForm.customerPhone.trim(), productName: orderForm.productName.trim(), sellingPrice, purchasePrice, deposit, remaining: sellingPrice - deposit, profit: sellingPrice - purchasePrice, status: orderForm.status, deliveryCompany: orderForm.deliveryCompany.trim(), trackingCode: orderForm.trackingCode.trim(), note: orderForm.note.trim(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setOrderForm(emptyOrder); setMessage("Commande ajoutée."); setPage("orders");
    } catch { setMessage("Erreur ajout commande."); }
    finally { setLoading(false); }
  }

  async function updateStatus(order, status) {
    await updateDoc(doc(db, "orders", order.id), { status, updatedAt: serverTimestamp() });
    setMessage("Statut mis à jour.");
  }

  async function updatePayment(order, deposit) {
    const value = Number(deposit || 0);
    if (value < 0 || value > Number(order.sellingPrice || 0)) return setMessage("Montant invalide.");
    await updateDoc(doc(db, "orders", order.id), { deposit: value, remaining: Number(order.sellingPrice || 0) - value, updatedAt: serverTimestamp() });
    setMessage("Paiement mis à jour.");
  }

  async function updateDelivery(order, data) {
    await updateDoc(doc(db, "orders", order.id), { status: data.status, deliveryCompany: data.deliveryCompany.trim(), trackingCode: data.trackingCode.trim(), updatedAt: serverTimestamp() });
    setMessage("Livraison mise à jour.");
  }

  async function deleteOrder(order) {
    if (!window.confirm("Supprimer cette commande ?")) return;
    await deleteDoc(doc(db, "orders", order.id)); setMessage("Commande supprimée.");
  }

  async function addExpense(e) {
    e.preventDefault(); setMessage("");
    if (!expenseForm.label.trim()) return setMessage("Ajoute le nom de la charge.");
    if (!expenseForm.amount) return setMessage("Ajoute le montant.");
    try {
      setLoading(true);
      await addDoc(collection(db, "orders"), { recordType: "expense", userId: user.uid, label: expenseForm.label.trim(), amount: Number(expenseForm.amount || 0), category: expenseForm.category, note: expenseForm.note.trim(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setExpenseForm(emptyExpense); setMessage("Charge ajoutée.");
    } catch { setMessage("Erreur ajout charge."); }
    finally { setLoading(false); }
  }

  async function deleteExpense(expense) {
    if (!window.confirm("Supprimer cette charge ?")) return;
    await deleteDoc(doc(db, "orders", expense.id)); setMessage("Charge supprimée.");
  }

  const appClass = dark ? "min-h-screen bg-[#07142B] text-white pb-28" : "min-h-screen bg-[#F5F8FC] text-slate-950 pb-28";

  if (!user) return <main dir={dir} className={appClass}><div className="mx-auto max-w-md px-5 py-8"><Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} /><section className={card(dark, "mt-6 text-center")}><img src="/shopflow-logo.svg" alt="ShopFlow DZ" className="mx-auto mb-5 w-56" /><h1 className="text-2xl font-black">{t.welcome}</h1><p className={muted(dark, "mt-2 text-sm")}>{t.subtitle}</p><div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100/70 p-1"><button onClick={() => setAuthMode("login")} className={tab(authMode === "login", dark)}>{t.login}</button><button onClick={() => setAuthMode("register")} className={tab(authMode === "register", dark)}>{t.register}</button></div><form onSubmit={authMode === "login" ? login : register} className="mt-5 space-y-3 text-start">{authMode === "register" && <Field label={t.shopName} value={shopName} onChange={e => setShopName(e.target.value)} dark={dark} />}<Field label={t.email} type="email" value={email} onChange={e => setEmail(e.target.value)} dark={dark} /><Field label={t.password} type="password" value={password} onChange={e => setPassword(e.target.value)} dark={dark} /><button disabled={loading} className="primary-btn w-full">{loading ? "..." : authMode === "login" ? t.connect : t.create}</button></form><Notice message={message} dark={dark} /></section><div className="mt-4 grid grid-cols-2 gap-3"><LinkBox href="/beta.html" title={t.beta} dark={dark} /><LinkBox href="/guide.html" title={t.guide} dark={dark} /></div></div></main>;

  return <main dir={dir} className={appClass}><header className={dark ? "sticky top-0 z-20 border-b border-white/10 bg-[#07142B]/95 backdrop-blur" : "sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"}><div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3"><img src="/shopflow-logo.svg" alt="ShopFlow DZ" className="w-32" /><p className={muted(dark, "min-w-0 flex-1 truncate text-xs")}>{user.email}</p><Controls lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} small /><button onClick={logout} className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{t.logout}</button></div></header><div className="mx-auto max-w-2xl px-4 py-5"><Notice message={message} dark={dark} />{page === "dashboard" && <Dashboard stats={stats} setPage={setPage} t={t} dark={dark} />}{page === "add" && <AddOrder form={orderForm} setForm={setOrderForm} submit={addOrder} loading={loading} t={t} dark={dark} />}{page === "orders" && <Orders orders={orders} updateStatus={updateStatus} deleteOrder={deleteOrder} t={t} dark={dark} />}{page === "payments" && <Payments orders={orders} updatePayment={updatePayment} t={t} dark={dark} />}{page === "delivery" && <Delivery orders={orders} updateDelivery={updateDelivery} t={t} dark={dark} />}{page === "expenses" && <Expenses expenses={expenses} form={expenseForm} setForm={setExpenseForm} submit={addExpense} deleteExpense={deleteExpense} loading={loading} t={t} dark={dark} />}{page === "clients" && <Clients clients={clients} t={t} dark={dark} />}{page === "more" && <More t={t} dark={dark} />}</div><a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className="fixed bottom-24 right-4 z-30 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-3 text-sm font-black text-[#07142B] shadow-xl">Instagram</a><Nav page={page} setPage={setPage} t={t} dark={dark} /></main>;
}

function Dashboard({ stats, setPage, t, dark }) { return <section className="space-y-4"><div className={card(dark)}><p className={muted(dark, "text-sm")}>ShopFlow DZ</p><h2 className="mt-1 text-3xl font-black">{t.dashboard}</h2><div className="mt-5 grid grid-cols-2 gap-3"><Stat label={t.sales} value={money(stats.sales)} dark={dark} /><Stat label={t.net} value={money(stats.net)} dark={dark} hot /><Stat label={t.remaining} value={money(stats.remaining)} dark={dark} /><Stat label={t.active} value={stats.active} dark={dark} /><Stat label={t.expenses} value={money(stats.charges)} dark={dark} /><Stat label={t.ready} value={stats.ready} dark={dark} /></div></div><div className="grid grid-cols-2 gap-3"><Quick onClick={() => setPage("add")} label={t.addOrder} /><Quick onClick={() => setPage("expenses")} label={t.addExpense} /><Quick onClick={() => setPage("payments")} label={t.payments} /><Quick onClick={() => setPage("delivery")} label={t.delivery} /></div></section>; }
function AddOrder({ form, setForm, submit, loading, t, dark }) { const set = (key, value) => setForm({ ...form, [key]: value }); return <section className={card(dark)}><h2 className="text-2xl font-black">{t.addOrder}</h2><form onSubmit={submit} className="mt-4 space-y-3"><Field label={t.customer} value={form.customerName} onChange={e => set("customerName", e.target.value)} dark={dark} /><Field label={t.phone} value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} dark={dark} /><Field label={t.product} value={form.productName} onChange={e => set("productName", e.target.value)} dark={dark} /><div className="grid grid-cols-2 gap-3"><Field label={t.selling} type="number" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} dark={dark} /><Field label={t.purchase} type="number" value={form.purchasePrice} onChange={e => set("purchasePrice", e.target.value)} dark={dark} /></div><Field label={t.deposit} type="number" value={form.deposit} onChange={e => set("deposit", e.target.value)} dark={dark} /><Select label={t.status} value={form.status} onChange={e => set("status", e.target.value)} options={statuses} dark={dark} /><div className="grid grid-cols-2 gap-3"><Field label={t.company} value={form.deliveryCompany} onChange={e => set("deliveryCompany", e.target.value)} dark={dark} /><Field label={t.tracking} value={form.trackingCode} onChange={e => set("trackingCode", e.target.value)} dark={dark} /></div><Field label={t.note} value={form.note} onChange={e => set("note", e.target.value)} dark={dark} /><button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button></form></section>; }
function Orders({ orders, updateStatus, deleteOrder, t, dark }) { const [q, setQ] = useState(""); const shown = orders.filter(o => `${o.customerName} ${o.customerPhone} ${o.productName}`.toLowerCase().includes(q.toLowerCase())); return <section className="space-y-3"><Title title={t.orders} dark={dark} /><Field label={t.search} value={q} onChange={e => setQ(e.target.value)} dark={dark} />{shown.map(order => <article key={order.id} className={card(dark)}><div className="flex justify-between gap-3"><div><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p></div><span className="h-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">{order.status || "Nouvelle"}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><Mini label={t.selling} value={money(order.sellingPrice)} dark={dark} /><Mini label={t.deposit} value={money(order.deposit)} dark={dark} /><Mini label={t.remaining} value={money(order.remaining)} dark={dark} /></div><select value={order.status || "Nouvelle"} onChange={e => updateStatus(order, e.target.value)} className={`${field(dark)} mt-4`}>{statuses.map(s => <option key={s}>{s}</option>)}</select><div className="mt-3 flex gap-2"><a href={wa(order.customerPhone, `Bonjour ${order.customerName}, concernant votre commande ${order.productName}.`)} target="_blank" rel="noreferrer" className="flex-1 rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">WhatsApp</a><button onClick={() => deleteOrder(order)} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">{t.del}</button></div></article>)}</section>; }
function Payments({ orders, updatePayment, t, dark }) { return <section className="space-y-3"><Title title={t.payments} dark={dark} />{orders.filter(o => o.status !== "Annulée" && o.status !== "Retour").map(order => <Payment key={order.id} order={order} updatePayment={updatePayment} t={t} dark={dark} />)}</section>; }
function Payment({ order, updatePayment, t, dark }) { const [deposit, setDeposit] = useState(order.deposit || 0); useEffect(() => setDeposit(order.deposit || 0), [order.deposit]); return <article className={card(dark)}><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p><div className="mt-4 grid grid-cols-2 gap-3"><Field label={t.deposit} type="number" value={deposit} onChange={e => setDeposit(e.target.value)} dark={dark} /><Mini label={t.remaining} value={money(Number(order.sellingPrice || 0) - Number(deposit || 0))} dark={dark} /></div><button onClick={() => updatePayment(order, deposit)} className="primary-btn mt-3 w-full">{t.update}</button></article>; }
function Delivery({ orders, updateDelivery, t, dark }) { return <section className="space-y-3"><Title title={t.delivery} dark={dark} />{orders.filter(o => o.status !== "Nouvelle" && o.status !== "Annulée").map(order => <DeliveryItem key={order.id} order={order} updateDelivery={updateDelivery} t={t} dark={dark} />)}</section>; }
function DeliveryItem({ order, updateDelivery, t, dark }) { const [form, setForm] = useState({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" }); useEffect(() => setForm({ status: order.status || "Confirmée", deliveryCompany: order.deliveryCompany || "", trackingCode: order.trackingCode || "" }), [order]); return <article className={card(dark)}><h3 className="font-black">{order.customerName}</h3><p className={muted(dark, "text-sm")}>{order.productName}</p><div className="mt-4 space-y-3"><Select label={t.status} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={deliveryStatuses} dark={dark} /><Field label={t.company} value={form.deliveryCompany} onChange={e => setForm({ ...form, deliveryCompany: e.target.value })} dark={dark} /><Field label={t.tracking} value={form.trackingCode} onChange={e => setForm({ ...form, trackingCode: e.target.value })} dark={dark} /><button onClick={() => updateDelivery(order, form)} className="primary-btn w-full">{t.update}</button></div></article>; }
function Expenses({ expenses, form, setForm, submit, deleteExpense, loading, t, dark }) { const set = (key, value) => setForm({ ...form, [key]: value }); return <section className="space-y-4"><div className={card(dark)}><h2 className="text-2xl font-black">{t.expenses}</h2><p className={muted(dark, "mt-1 text-sm")}>{money(sum(expenses, "amount"))}</p><form onSubmit={submit} className="mt-4 space-y-3"><Field label={t.expenseName} value={form.label} onChange={e => set("label", e.target.value)} dark={dark} /><Field label={t.amount} type="number" value={form.amount} onChange={e => set("amount", e.target.value)} dark={dark} /><Select label={t.category} value={form.category} onChange={e => set("category", e.target.value)} options={expenseCategories} dark={dark} /><Field label={t.note} value={form.note} onChange={e => set("note", e.target.value)} dark={dark} /><button disabled={loading} className="primary-btn w-full">{loading ? "..." : t.save}</button></form></div>{expenses.map(expense => <article key={expense.id} className={card(dark)}><div className="flex justify-between gap-3"><div><h3 className="font-black">{expense.label}</h3><p className={muted(dark, "text-sm")}>{expense.category}</p></div><strong>{money(expense.amount)}</strong></div>{expense.note && <p className={muted(dark, "mt-2 text-sm")}>{expense.note}</p>}<button onClick={() => deleteExpense(expense)} className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-600">{t.del}</button></article>)}</section>; }
function Clients({ clients, t, dark }) { return <section className="space-y-3"><Title title={t.clients} dark={dark} />{clients.map(c => <article key={c.id} className={card(dark)}><div className="flex justify-between gap-3"><div><h3 className="font-black">{c.name}</h3><p className={muted(dark, "text-sm")}>{c.phone || "Sans téléphone"}</p></div><strong>{c.totalOrders}</strong></div><div className="mt-4 grid grid-cols-3 gap-2"><Mini label={t.sales} value={money(c.totalSpent)} dark={dark} /><Mini label={t.deposit} value={money(c.totalDeposits)} dark={dark} /><Mini label={t.remaining} value={money(c.totalRemaining)} dark={dark} /></div>{c.phone && <a href={wa(c.phone, `Bonjour ${c.name}, c'est ShopFlow DZ.`)} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-black text-green-700">WhatsApp</a>}</article>)}</section>; }
function More({ t, dark }) { const [c, setC] = useState({ name: "", phone: "", message: "" }); const msg = `Bonjour ShopFlow DZ, je suis ${c.name || "..."} (${c.phone || "..."}). ${c.message || "Je veux vous contacter."}`; return <section className="space-y-4"><div className={card(dark)}><h2 className="text-2xl font-black">{t.more}</h2><div className="mt-4 grid grid-cols-2 gap-3"><LinkBox href="/beta.html" title={t.beta} dark={dark} /><LinkBox href="/guide.html" title={t.guide} dark={dark} /><LinkBox href="/faq.html" title={t.faq} dark={dark} /><LinkBox href="/privacy.html" title={t.privacy} dark={dark} /><LinkBox href="/terms.html" title={t.terms} dark={dark} /><LinkBox href="https://www.instagram.com/shopflowdz/" title={t.instagram} dark={dark} /></div></div><div className={card(dark)}><h2 className="text-2xl font-black">{t.contact}</h2><p className={muted(dark, "mt-1 text-sm")}>{t.contactHelp}</p><div className="mt-4 space-y-3"><Field label="Nom" value={c.name} onChange={e => setC({ ...c, name: e.target.value })} dark={dark} /><Field label="Téléphone" value={c.phone} onChange={e => setC({ ...c, phone: e.target.value })} dark={dark} /><Field label="Message" value={c.message} onChange={e => setC({ ...c, message: e.target.value })} dark={dark} /><a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" onClick={() => navigator.clipboard?.writeText(msg)} className="primary-btn block text-center">{t.instagram}</a><p className={muted(dark, "text-xs")}>Le message est copié automatiquement si le navigateur l'autorise.</p></div></div></section>; }
function Nav({ page, setPage, t, dark }) { const items = [["dashboard", t.dashboard], ["add", t.add], ["orders", t.orders], ["payments", t.payments], ["delivery", t.delivery], ["expenses", t.expenses], ["more", t.more]]; return <nav className={dark ? "fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[#07142B]/95 backdrop-blur" : "fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"}><div className="mx-auto grid max-w-2xl grid-cols-7 gap-1 px-2 py-2">{items.map(([key, label]) => <button key={key} onClick={() => setPage(key)} className={page === key ? "rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-1 py-3 text-[10px] font-black text-[#07142B]" : `rounded-2xl px-1 py-3 text-[10px] font-bold ${dark ? "text-slate-300" : "text-slate-500"}`}>{label}</button>)}</div></nav>; }
function Controls({ lang, setLang, theme, setTheme, small }) { return <div className={`flex ${small ? "gap-1" : "justify-end gap-2"}`}><button onClick={() => setLang(lang === "fr" ? "ar" : "fr")} className="rounded-full border border-cyan-300/40 bg-white/10 px-3 py-2 text-xs font-black">{lang === "fr" ? "AR" : "FR"}</button><button onClick={() => setTheme(theme === "light" ? "night" : "light")} className="rounded-full border border-cyan-300/40 bg-white/10 px-3 py-2 text-xs font-black">{theme === "light" ? "🌙" : "☀️"}</button></div>; }
function Field({ label, dark, ...props }) { return <label className="block"><span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span><input {...props} className={field(dark)} /></label>; }
function Select({ label, options, dark, ...props }) { return <label className="block"><span className={muted(dark, "mb-1 block text-xs font-bold")}>{label}</span><select {...props} className={field(dark)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>; }
function Title({ title, dark }) { return <div className={card(dark)}><h2 className="text-2xl font-black">{title}</h2></div>; }
function Stat({ label, value, dark, hot }) { return <div className={hot ? "rounded-3xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] p-4 text-[#07142B]" : dark ? "rounded-3xl bg-white/5 p-4" : "rounded-3xl bg-slate-50 p-4"}><p className={`text-xs font-bold ${hot ? "text-[#07142B]/70" : dark ? "text-slate-300" : "text-slate-500"}`}>{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
function Mini({ label, value, dark }) { return <div className={dark ? "rounded-2xl bg-white/5 p-3" : "rounded-2xl bg-slate-50 p-3"}><p className={muted(dark, "text-[11px] font-bold")}>{label}</p><p className="mt-1 font-black">{value}</p></div>; }
function Quick({ label, onClick }) { return <button onClick={onClick} className="rounded-3xl bg-[#07142B] p-4 text-left font-black text-white shadow-lg">{label}</button>; }
function LinkBox({ href, title, dark }) { return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className={dark ? "rounded-3xl border border-white/10 bg-white/5 p-4 text-sm font-black text-white" : "rounded-3xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-900 shadow-sm"}>{title}</a>; }
function Notice({ message, dark }) { if (!message) return null; return <div className={dark ? "mb-4 rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-sm font-bold text-cyan-100" : "mb-4 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-bold text-cyan-800"}>{message}</div>; }
function card(dark, extra = "") { return `${dark ? "rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl" : "rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm"} ${extra}`; }
function muted(dark, extra = "") { return `${dark ? "text-slate-300" : "text-slate-500"} ${extra}`; }
function field(dark) { return `w-full rounded-2xl border px-4 py-3 outline-none transition ${dark ? "border-white/10 bg-white/10 text-white placeholder:text-slate-400" : "border-slate-200 bg-white text-slate-950"}`; }
function tab(active, dark) { return active ? "rounded-xl bg-[#07142B] px-4 py-3 text-sm font-black text-white" : `rounded-xl px-4 py-3 text-sm font-bold ${dark ? "text-slate-300" : "text-slate-500"}`; }
function money(value) { return `${Number(value || 0).toLocaleString("fr-FR")} DA`; }
function sum(items, key) { return items.reduce((total, item) => total + Number(item[key] || 0), 0); }
function buildClients(orders) { const map = new Map(); orders.forEach(order => { const name = order.customerName || "Cliente sans nom"; const phone = order.customerPhone || ""; const key = (phone || name || order.id).trim().toLowerCase(); const active = order.status !== "Annulée" && order.status !== "Retour"; if (!map.has(key)) map.set(key, { id: key, name, phone, totalOrders: 0, activeOrders: 0, totalSpent: 0, totalDeposits: 0, totalRemaining: 0 }); const c = map.get(key); c.totalOrders += 1; if (active) { c.activeOrders += 1; c.totalSpent += Number(order.sellingPrice || 0); c.totalDeposits += Number(order.deposit || 0); c.totalRemaining += Number(order.remaining || 0); } }); return Array.from(map.values()).sort((a, b) => b.totalOrders - a.totalOrders); }
function waNumber(phone) { const digits = String(phone || "").replace(/\D/g, ""); if (!digits) return ""; if (digits.startsWith("213")) return digits; if (digits.startsWith("0")) return `213${digits.slice(1)}`; return digits; }
function wa(phone, message) { const number = waNumber(phone); return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "https://wa.me/"; }
