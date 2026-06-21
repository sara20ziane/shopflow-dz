
import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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

const INSTAGRAM_URL = "https://www.instagram.com/shopflowdz/";

const STATUS_OPTIONS = [
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

const DELIVERY_STATUS_OPTIONS = [
  "Confirmée",
  "Commandée fournisseur",
  "Reçue",
  "En livraison",
  "Livrée",
  "Retour",
];

const INITIAL_ORDER_FORM = {
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

const COPY = {
  fr: {
    login: "Connexion",
    register: "Inscription",
    shopName: "Nom de la boutique",
    email: "Adresse email",
    password: "Mot de passe",
    loading: "Chargement...",
    connect: "Se connecter",
    createAccount: "Créer mon compte",
    beta: "Version beta 🇩🇿",
    hero: "Gère tes commandes, acomptes, livraisons et clientes depuis une seule application.",
    logout: "Sortir",
    dashboard: "Accueil",
    add: "Ajouter",
    orders: "Cmdes",
    payments: "Paiem.",
    delivery: "Livr.",
    more: "Plus",
    dashboardTitle: "Tableau de bord",
    dashboardSub: "Résumé de ton activité",
    ordersTotal: "Commandes",
    active: "Actives",
    ready: "Prêtes",
    inDelivery: "En livraison",
    delivered: "Livrées",
    revenue: "CA total",
    deposits: "Acomptes",
    remaining: "Reste",
    profit: "Bénéfice estimé",
    profitNote: "Les commandes annulées et les retours ne sont pas comptés dans le CA.",
    newOrder: "Nouvelle commande",
    addOrderSub: "Ajoute une commande cliente",
    saveOrder: "Enregistrer la commande",
    saving: "Enregistrement...",
    customer: "Cliente",
    phone: "Téléphone",
    product: "Produit",
    sellingPrice: "Prix de vente",
    purchasePrice: "Prix d'achat",
    deposit: "Acompte payé",
    status: "Statut",
    deliveryCompany: "Société livraison",
    trackingCode: "Code suivi",
    note: "Note",
    search: "Rechercher cliente, téléphone ou produit",
    all: "Tous",
    displayedOrders: "commande(s) affichée(s)",
    noOrders: "Aucune commande pour le moment.",
    noMatch: "Aucune commande ne correspond au filtre.",
    edit: "Modifier",
    delete: "Supprimer",
    cancel: "Annuler",
    save: "Enregistrer",
    price: "Prix",
    paid: "Payé",
    buy: "Achat",
    paymentTitle: "Paiements",
    paymentSub: "Acomptes et restes à encaisser",
    unpaid: "Non soldées",
    paidOrders: "Soldées",
    toCollect: "À encaisser",
    noPayments: "Aucun paiement à suivre pour le moment.",
    savePayment: "Enregistrer paiement",
    paidFull: "Soldée",
    whatsappReminder: "Relancer sur WhatsApp",
    deliveryTitle: "Livraison",
    deliverySub: "Suivi des colis et statuts livraison",
    returns: "Retours",
    deliverySearch: "Rechercher cliente, produit, société ou suivi",
    toFollow: "À suivre",
    noDelivery: "Aucun colis à suivre pour le moment.",
    deliveryUpdate: "Mettre à jour livraison",
    whatsappDelivery: "Message livraison",
    clients: "Clientes",
    clientsSub: "Fiches clientes générées automatiquement",
    noClients: "Aucune cliente pour le moment.",
    spent: "Total achats",
    latest: "Dernier statut",
    openWhatsapp: "Ouvrir WhatsApp",
    moreTitle: "Centre ShopFlow",
    moreSub: "Aide, contact et liens utiles",
    openApp: "Application",
    guide: "Guide",
    faq: "FAQ",
    privacy: "Confidentialité",
    terms: "Conditions beta",
    instagram: "Instagram",
    contact: "Contact beta",
    contactName: "Votre nom",
    contactShop: "Nom de boutique",
    contactWhatsapp: "WhatsApp",
    contactMessage: "Votre message",
    copyMessage: "Copier le message",
    copied: "Message copié. Collez-le en DM Instagram.",
    openInstagram: "Envoyer sur Instagram",
    light: "Light",
    night: "Night",
  },
  ar: {
    login: "دخول",
    register: "تسجيل",
    shopName: "اسم المتجر",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    loading: "جاري التحميل...",
    connect: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    beta: "نسخة تجريبية 🇩🇿",
    hero: "سيّري الطلبات، العربون، التوصيل والزبائن من تطبيق واحد.",
    logout: "خروج",
    dashboard: "الرئيسية",
    add: "إضافة",
    orders: "طلبات",
    payments: "دفع",
    delivery: "توصيل",
    more: "المزيد",
    dashboardTitle: "لوحة التحكم",
    dashboardSub: "ملخص نشاطك",
    ordersTotal: "الطلبات",
    active: "نشطة",
    ready: "جاهزة",
    inDelivery: "في التوصيل",
    delivered: "تم التوصيل",
    revenue: "المبيعات",
    deposits: "العربون",
    remaining: "الباقي",
    profit: "الربح المتوقع",
    profitNote: "الطلبات الملغاة والمرتجعة لا تدخل في الحساب.",
    newOrder: "طلب جديد",
    addOrderSub: "أضيفي طلب زبونة",
    saveOrder: "حفظ الطلب",
    saving: "جاري الحفظ...",
    customer: "الزبونة",
    phone: "الهاتف",
    product: "المنتج",
    sellingPrice: "سعر البيع",
    purchasePrice: "سعر الشراء",
    deposit: "العربون المدفوع",
    status: "الحالة",
    deliveryCompany: "شركة التوصيل",
    trackingCode: "كود التتبع",
    note: "ملاحظة",
    search: "ابحثي بالزبونة، الهاتف أو المنتج",
    all: "الكل",
    displayedOrders: "طلب معروض",
    noOrders: "لا توجد طلبات حاليا.",
    noMatch: "لا توجد نتائج مطابقة.",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    save: "حفظ",
    price: "السعر",
    paid: "مدفوع",
    buy: "الشراء",
    paymentTitle: "الدفع",
    paymentSub: "العربون والمبالغ المتبقية",
    unpaid: "غير مكتملة",
    paidOrders: "مكتملة",
    toCollect: "للتحصيل",
    noPayments: "لا توجد مدفوعات للمتابعة حاليا.",
    savePayment: "حفظ الدفع",
    paidFull: "مدفوعة",
    whatsappReminder: "تذكير واتساب",
    deliveryTitle: "التوصيل",
    deliverySub: "متابعة الطرود والحالة",
    returns: "مرتجعات",
    deliverySearch: "ابحثي بالزبونة، المنتج، الشركة أو الكود",
    toFollow: "للمتابعة",
    noDelivery: "لا توجد طرود للمتابعة حاليا.",
    deliveryUpdate: "تحديث التوصيل",
    whatsappDelivery: "رسالة التوصيل",
    clients: "الزبائن",
    clientsSub: "بطاقات زبائن تلقائية",
    noClients: "لا توجد زبائن حاليا.",
    spent: "إجمالي الشراء",
    latest: "آخر حالة",
    openWhatsapp: "فتح واتساب",
    moreTitle: "مركز ShopFlow",
    moreSub: "مساعدة، تواصل وروابط مهمة",
    openApp: "التطبيق",
    guide: "الدليل",
    faq: "أسئلة",
    privacy: "الخصوصية",
    terms: "شروط beta",
    instagram: "إنستغرام",
    contact: "تواصل beta",
    contactName: "الاسم",
    contactShop: "اسم المتجر",
    contactWhatsapp: "واتساب",
    contactMessage: "رسالتك",
    copyMessage: "نسخ الرسالة",
    copied: "تم نسخ الرسالة. ألصقيها في DM إنستغرام.",
    openInstagram: "إرسال على إنستغرام",
    light: "فاتح",
    night: "ليلي",
  },
};

function AppV2() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [language, setLanguage] = useState(() => localStorage.getItem("shopflow-language") || "fr");
  const [theme, setTheme] = useState(() => localStorage.getItem("shopflow-theme") || "light");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderForm, setOrderForm] = useState(INITIAL_ORDER_FORM);

  const t = (key) => COPY[language]?.[key] || COPY.fr[key] || key;
  const isDark = theme === "night";

  useEffect(() => {
    localStorage.setItem("shopflow-language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("shopflow-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }))
        .filter((item) => item.recordType !== "expense");

      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });

      setOrders(sortedOrders);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => order.status !== "Annulée" && order.status !== "Retour"
    );

    const totalSales = activeOrders.reduce(
      (sum, order) => sum + Number(order.sellingPrice || 0),
      0
    );

    const totalPurchases = activeOrders.reduce(
      (sum, order) => sum + Number(order.purchasePrice || 0),
      0
    );

    const totalDeposits = activeOrders.reduce(
      (sum, order) => sum + Number(order.deposit || 0),
      0
    );

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      readyOrders: orders.filter((order) => order.status === "Reçue").length,
      inDeliveryOrders: orders.filter((order) => order.status === "En livraison").length,
      deliveredOrders: orders.filter((order) => order.status === "Livrée").length,
      canceledOrders: orders.filter(
        (order) => order.status === "Annulée" || order.status === "Retour"
      ).length,
      totalSales,
      totalDeposits,
      remaining: totalSales - totalDeposits,
      profit: totalSales - totalPurchases,
    };
  }, [orders]);

  const clients = useMemo(() => {
    const clientsMap = new Map();

    orders.forEach((order) => {
      const name = order.customerName || "Cliente";
      const phone = order.customerPhone || "";
      const key = (phone || name || order.id).trim().toLowerCase();
      const isActive = order.status !== "Annulée" && order.status !== "Retour";
      const orderDate = order.createdAt?.seconds || 0;

      if (!clientsMap.has(key)) {
        clientsMap.set(key, {
          id: key,
          name,
          phone,
          totalOrders: 0,
          activeOrders: 0,
          totalSpent: 0,
          totalDeposits: 0,
          totalRemaining: 0,
          latestStatus: order.status || "Nouvelle",
          latestDate: orderDate,
        });
      }

      const client = clientsMap.get(key);
      client.totalOrders += 1;

      if (isActive) {
        client.activeOrders += 1;
        client.totalSpent += Number(order.sellingPrice || 0);
        client.totalDeposits += Number(order.deposit || 0);
        client.totalRemaining += Number(order.remaining || 0);
      }

      if (orderDate >= client.latestDate) {
        client.name = name;
        client.phone = phone || client.phone;
        client.latestStatus = order.status || client.latestStatus;
        client.latestDate = orderDate;
      }
    });

    return Array.from(clientsMap.values()).sort((a, b) => b.latestDate - a.latestDate);
  }, [orders]);

  const resetMessage = () => setMessage("");

  const toggleTheme = () => setTheme((current) => (current === "light" ? "night" : "light"));

  const toggleLanguage = () => setLanguage((current) => (current === "fr" ? "ar" : "fr"));

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessage();

    if (!shopName.trim()) {
      setMessage("Ajoute le nom de ta boutique.");
      return;
    }

    if (password.length < 6) {
      setMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Compte créé avec succès.");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setMessage("Cet email est déjà utilisé.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("Adresse email invalide.");
      } else {
        setMessage("Erreur lors de la création du compte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessage();

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Connexion réussie.");
    } catch (error) {
      if (error.code === "auth/invalid-credential") {
        setMessage("Email ou mot de passe incorrect.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("Adresse email invalide.");
      } else {
        setMessage("Erreur lors de la connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setEmail("");
    setPassword("");
    setShopName("");
    setOrders([]);
    setMessage("Déconnexion réussie.");
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    resetMessage();

    if (!orderForm.customerName.trim()) {
      setMessage("Ajoute le nom de la cliente.");
      return;
    }

    if (!orderForm.productName.trim()) {
      setMessage("Ajoute le nom du produit.");
      return;
    }

    if (!orderForm.sellingPrice) {
      setMessage("Ajoute le prix de vente.");
      return;
    }

    try {
      setLoading(true);

      const sellingPrice = Number(orderForm.sellingPrice || 0);
      const purchasePrice = Number(orderForm.purchasePrice || 0);
      const deposit = Number(orderForm.deposit || 0);
      const remaining = sellingPrice - deposit;
      const profit = sellingPrice - purchasePrice;

      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        productName: orderForm.productName.trim(),
        sellingPrice,
        purchasePrice,
        deposit,
        remaining,
        profit,
        status: orderForm.status,
        deliveryCompany: orderForm.deliveryCompany.trim(),
        trackingCode: orderForm.trackingCode.trim(),
        note: orderForm.note.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setOrderForm(INITIAL_ORDER_FORM);
      setMessage("Commande ajoutée avec succès.");
      setPage("orders");
    } catch (error) {
      setMessage("Erreur lors de l'ajout de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    resetMessage();

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setMessage("Statut mis à jour.");
    } catch (error) {
      setMessage("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleUpdatePayment = async (order, newDepositValue) => {
    resetMessage();

    const sellingPrice = Number(order.sellingPrice || 0);
    const deposit = Number(newDepositValue || 0);

    if (deposit < 0 || deposit > sellingPrice) {
      setMessage("Montant invalide.");
      return false;
    }

    try {
      await updateDoc(doc(db, "orders", order.id), {
        deposit,
        remaining: sellingPrice - deposit,
        updatedAt: serverTimestamp(),
      });
      setMessage("Paiement mis à jour.");
      return true;
    } catch (error) {
      setMessage("Erreur lors de la mise à jour du paiement.");
      return false;
    }
  };

  const handleUpdateDelivery = async (order, deliveryData) => {
    resetMessage();

    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: deliveryData.status,
        deliveryCompany: deliveryData.deliveryCompany.trim(),
        trackingCode: deliveryData.trackingCode.trim(),
        updatedAt: serverTimestamp(),
      });
      setMessage("Suivi livraison mis à jour.");
      return true;
    } catch (error) {
      setMessage("Erreur lors de la mise à jour livraison.");
      return false;
    }
  };

  const handleUpdateOrder = async (orderId, formData) => {
    resetMessage();

    if (!formData.customerName.trim() || !formData.productName.trim() || !formData.sellingPrice) {
      setMessage("Complète les champs obligatoires.");
      return false;
    }

    try {
      const sellingPrice = Number(formData.sellingPrice || 0);
      const purchasePrice = Number(formData.purchasePrice || 0);
      const deposit = Number(formData.deposit || 0);

      await updateDoc(doc(db, "orders", orderId), {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        productName: formData.productName.trim(),
        sellingPrice,
        purchasePrice,
        deposit,
        remaining: sellingPrice - deposit,
        profit: sellingPrice - purchasePrice,
        status: formData.status,
        deliveryCompany: formData.deliveryCompany.trim(),
        trackingCode: formData.trackingCode.trim(),
        note: formData.note.trim(),
        updatedAt: serverTimestamp(),
      });

      setMessage("Commande modifiée.");
      return true;
    } catch (error) {
      setMessage("Erreur lors de la modification.");
      return false;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    resetMessage();

    const confirmed = window.confirm("Supprimer cette commande ?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "orders", orderId));
      setMessage("Commande supprimée.");
    } catch (error) {
      setMessage("Erreur lors de la suppression.");
    }
  };

  const appClass = isDark
    ? "min-h-screen bg-[#07132d] text-white"
    : "min-h-screen bg-slate-100 text-slate-900";

  if (!user) {
    return (
      <div className={appClass} dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="min-h-screen flex items-center justify-center p-5">
          <div className={`${surface(isDark)} w-full max-w-md rounded-[2rem] shadow-xl p-6 border ${border(isDark)}`}>
            <TopControls
              language={language}
              theme={theme}
              onLanguage={toggleLanguage}
              onTheme={toggleTheme}
              t={t}
            />

            <Logo className="w-24 h-24 mx-auto mt-4" />

            <h1 className="mt-5 text-3xl font-extrabold text-center">
              ShopFlow DZ
            </h1>

            <p className={`mt-3 leading-relaxed text-center ${muted(isDark)}`}>
              {t("hero")}
            </p>

            <div className={`mt-6 grid grid-cols-2 gap-2 rounded-2xl p-1 ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
              <button
                onClick={() => {
                  setMode("login");
                  resetMessage();
                }}
                className={`py-3 rounded-xl font-bold ${
                  mode === "login" ? activePill(isDark) : muted(isDark)
                }`}
              >
                {t("login")}
              </button>

              <button
                onClick={() => {
                  setMode("register");
                  resetMessage();
                }}
                className={`py-3 rounded-xl font-bold ${
                  mode === "register" ? activePill(isDark) : muted(isDark)
                }`}
              >
                {t("register")}
              </button>
            </div>

            <form
              onSubmit={mode === "login" ? handleLogin : handleRegister}
              className="mt-5 space-y-3"
            >
              {mode === "register" && (
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t("shopName")}
                  isDark={isDark}
                />
              )}

              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                isDark={isDark}
              />

              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                isDark={isDark}
              />

              {message && <Message text={message} isDark={isDark} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 py-4 rounded-2xl font-extrabold disabled:opacity-60"
              >
                {loading ? t("loading") : mode === "login" ? t("connect") : t("createAccount")}
              </button>
            </form>

            <p className={`mt-5 text-sm text-center ${muted(isDark)}`}>{t("beta")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={appClass} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="min-h-screen max-w-md mx-auto pb-24">
        <header className={`${surface(isDark)} p-4 shadow-sm sticky top-0 z-10 border-b ${border(isDark)}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Logo className="w-12 h-12 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold">ShopFlow DZ</h1>
                <p className={`text-xs break-all ${muted(isDark)}`}>{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TopControls
                language={language}
                theme={theme}
                onLanguage={toggleLanguage}
                onTheme={toggleTheme}
                t={t}
                compact
              />
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-600 px-3 py-2 rounded-2xl font-bold text-xs"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        </header>

        <main className="p-5">
          {message && <Message text={message} isDark={isDark} />}

          {page === "dashboard" && <Dashboard stats={stats} t={t} isDark={isDark} />}
          {page === "add" && (
            <AddOrder
              orderForm={orderForm}
              onChange={handleOrderChange}
              onSubmit={handleAddOrder}
              loading={loading}
              t={t}
              isDark={isDark}
            />
          )}
          {page === "orders" && (
            <Orders
              orders={orders}
              onStatusChange={handleUpdateStatus}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              t={t}
              isDark={isDark}
            />
          )}
          {page === "payments" && (
            <Payments orders={orders} onUpdatePayment={handleUpdatePayment} t={t} isDark={isDark} />
          )}
          {page === "delivery" && (
            <Delivery orders={orders} onUpdateDelivery={handleUpdateDelivery} t={t} isDark={isDark} />
          )}
          {page === "more" && (
            <More clients={clients} t={t} isDark={isDark} />
          )}
        </main>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="fixed right-4 bottom-24 z-20 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-full px-4 py-3 text-sm font-extrabold shadow-lg"
        >
          Instagram
        </a>

        <nav className={`${surface(isDark)} fixed bottom-0 left-0 right-0 border-t ${border(isDark)}`}>
          <div className="max-w-md mx-auto grid grid-cols-6">
            <NavButton active={page === "dashboard"} onClick={() => setPage("dashboard")} label={t("dashboard")} isDark={isDark} />
            <NavButton active={page === "add"} onClick={() => { setPage("add"); resetMessage(); }} label={t("add")} isDark={isDark} />
            <NavButton active={page === "orders"} onClick={() => setPage("orders")} label={t("orders")} isDark={isDark} />
            <NavButton active={page === "payments"} onClick={() => setPage("payments")} label={t("payments")} isDark={isDark} />
            <NavButton active={page === "delivery"} onClick={() => setPage("delivery")} label={t("delivery")} isDark={isDark} />
            <NavButton active={page === "more"} onClick={() => setPage("more")} label={t("more")} isDark={isDark} />
          </div>
        </nav>
      </div>
    </div>
  );
}

function Logo({ className = "w-20 h-20 mx-auto" }) {
  return (
    <img
      src="/icon.svg"
      alt="ShopFlow DZ"
      className={`${className} object-contain drop-shadow-xl`}
    />
  );
}

function TopControls({ language, theme, onLanguage, onTheme, t, compact = false }) {
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "justify-end gap-2"}`}>
      <button
        type="button"
        onClick={onLanguage}
        className="rounded-2xl px-3 py-2 text-xs font-extrabold bg-cyan-50 text-cyan-700"
      >
        {language === "fr" ? "AR" : "FR"}
      </button>
      <button
        type="button"
        onClick={onTheme}
        className="rounded-2xl px-3 py-2 text-xs font-extrabold bg-teal-50 text-teal-700"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
}

function Message({ text, isDark }) {
  return (
    <p className={`mb-4 text-sm text-center rounded-2xl p-3 shadow-sm ${surface(isDark)} ${isDark ? "text-slate-100" : "text-slate-700"}`}>
      {text}
    </p>
  );
}

function Dashboard({ stats, t, isDark }) {
  return (
    <section>
      <SectionTitle title={t("dashboardTitle")} subtitle={t("dashboardSub")} isDark={isDark} />

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label={t("ordersTotal")} value={stats.totalOrders} isDark={isDark} />
        <StatCard label={t("active")} value={stats.activeOrders} isDark={isDark} />
        <StatCard label={t("ready")} value={stats.readyOrders} isDark={isDark} />
        <StatCard label={t("inDelivery")} value={stats.inDeliveryOrders} isDark={isDark} />
        <StatCard label={t("delivered")} value={stats.deliveredOrders} isDark={isDark} />
        <StatCard label={t("revenue")} value={`${formatAmount(stats.totalSales)} DA`} isDark={isDark} />
        <StatCard label={t("deposits")} value={`${formatAmount(stats.totalDeposits)} DA`} isDark={isDark} />
        <StatCard label={t("remaining")} value={`${formatAmount(stats.remaining)} DA`} isDark={isDark} />
      </div>

      <div className="mt-4 bg-gradient-to-br from-[#07132d] to-[#0f1b33] text-white rounded-3xl p-5 shadow-xl border border-white/10">
        <p className="text-sm text-cyan-200">{t("profit")}</p>
        <p className="text-3xl font-extrabold mt-1">{formatAmount(stats.profit)} DA</p>
        <p className="text-xs text-slate-300 mt-2">{t("profitNote")}</p>
      </div>
    </section>
  );
}

function StatCard({ label, value, isDark }) {
  return (
    <div className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)}`}>
      <p className={`text-sm ${muted(isDark)}`}>{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

function AddOrder({ orderForm, onChange, onSubmit, loading, t, isDark }) {
  return (
    <section>
      <SectionTitle title={t("newOrder")} subtitle={t("addOrderSub")} isDark={isDark} />

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <OrderFields form={orderForm} onChange={onChange} t={t} isDark={isDark} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-2xl p-4 font-extrabold disabled:opacity-60"
        >
          {loading ? t("saving") : t("saveOrder")}
        </button>
      </form>
    </section>
  );
}

function Orders({ orders, onStatusChange, onUpdateOrder, onDeleteOrder, t, isDark }) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_ORDER_FORM);

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === "Tous" || order.status === statusFilter;
      const searchableText = `${order.customerName || ""} ${order.customerPhone || ""} ${order.productName || ""}`.toLowerCase();
      const matchesSearch = cleanSearch.length === 0 || searchableText.includes(cleanSearch);
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchText, statusFilter]);

  const startEditing = (order) => {
    setEditingId(order.id);
    setEditForm({
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      productName: order.productName || "",
      sellingPrice: String(order.sellingPrice || ""),
      purchasePrice: String(order.purchasePrice || ""),
      deposit: String(order.deposit || ""),
      status: order.status || "Nouvelle",
      deliveryCompany: order.deliveryCompany || "",
      trackingCode: order.trackingCode || "",
      note: order.note || "",
    });
  };

  const stopEditing = () => {
    setEditingId(null);
    setEditForm(INITIAL_ORDER_FORM);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdateOrder(editingId, editForm);
    if (success) stopEditing();
  };

  return (
    <section>
      <SectionTitle title={t("ordersTotal")} subtitle={t("search")} isDark={isDark} />

      <FilterBox isDark={isDark}>
        <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t("search")} isDark={isDark} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} isDark={isDark}>
          <option value="Tous">{t("all")}</option>
          {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
        </Select>
        <p className={`text-sm ${muted(isDark)}`}>{filteredOrders.length} {t("displayedOrders")}</p>
      </FilterBox>

      {orders.length === 0 ? (
        <Empty text={t("noOrders")} isDark={isDark} />
      ) : filteredOrders.length === 0 ? (
        <Empty text={t("noMatch")} isDark={isDark} />
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)}`}>
              {editingId === order.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <h3 className="font-extrabold">{t("edit")}</h3>
                  <OrderFields form={editForm} onChange={handleEditChange} t={t} isDark={isDark} />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={stopEditing} className={secondaryButton(isDark)}>{t("cancel")}</button>
                    <button type="submit" className={primaryButton()}>{t("save")}</button>
                  </div>
                </form>
              ) : (
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onEdit={startEditing}
                  onDeleteOrder={onDeleteOrder}
                  t={t}
                  isDark={isDark}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order, onStatusChange, onEdit, onDeleteOrder, t, isDark }) {
  return (
    <>
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-extrabold">{order.customerName}</h3>
          <p className={`text-sm ${muted(isDark)}`}>{order.productName}</p>
        </div>

        <Select value={order.status} onChange={(e) => onStatusChange(order.id, e.target.value)} isDark={isDark} small>
          {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
        <Mini label={t("price")} value={`${formatAmount(order.sellingPrice)} DA`} isDark={isDark} />
        <Mini label={t("deposit")} value={`${formatAmount(order.deposit)} DA`} isDark={isDark} />
        <Mini label={t("remaining")} value={`${formatAmount(order.remaining)} DA`} isDark={isDark} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <Mini label={t("buy")} value={`${formatAmount(order.purchasePrice)} DA`} isDark={isDark} />
        <Mini label={t("profit")} value={`${formatAmount(order.profit)} DA`} isDark={isDark} />
      </div>

      {(order.deliveryCompany || order.trackingCode || order.customerPhone || order.note) && (
        <div className={`mt-3 rounded-2xl p-3 text-sm ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-500"}`}>
          {order.customerPhone && <p>{t("phone")} : {order.customerPhone}</p>}
          {order.deliveryCompany && <p>{t("deliveryCompany")} : {order.deliveryCompany}</p>}
          {order.trackingCode && <p>{t("trackingCode")} : {order.trackingCode}</p>}
          {order.note && <p>{t("note")} : {order.note}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button type="button" onClick={() => onEdit(order)} className={secondaryButton(isDark)}>{t("edit")}</button>
        <button type="button" onClick={() => onDeleteOrder(order.id)} className="w-full bg-red-50 text-red-600 rounded-2xl p-3 text-sm font-bold">{t("delete")}</button>
      </div>
    </>
  );
}

function Payments({ orders, onUpdatePayment, t, isDark }) {
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("À encaisser");

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "Annulée" && order.status !== "Retour"),
    [orders]
  );

  const paymentStats = useMemo(() => {
    const totalDeposits = activeOrders.reduce((sum, order) => sum + Number(order.deposit || 0), 0);
    const totalRemaining = activeOrders.reduce((sum, order) => sum + Number(order.remaining || 0), 0);

    return {
      totalDeposits,
      totalRemaining,
      unpaidOrders: activeOrders.filter((order) => Number(order.remaining || 0) > 0).length,
      paidOrders: activeOrders.filter((order) => Number(order.remaining || 0) === 0).length,
    };
  }, [activeOrders]);

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return activeOrders.filter((order) => {
      const remaining = Number(order.remaining || 0);
      const matchesFilter =
        paymentFilter === "Tous" ||
        (paymentFilter === "À encaisser" && remaining > 0) ||
        (paymentFilter === "Soldées" && remaining === 0);

      const searchableText = `${order.customerName || ""} ${order.customerPhone || ""} ${order.productName || ""}`.toLowerCase();
      const matchesSearch = cleanSearch.length === 0 || searchableText.includes(cleanSearch);
      return matchesFilter && matchesSearch;
    });
  }, [activeOrders, searchText, paymentFilter]);

  return (
    <section>
      <SectionTitle title={t("paymentTitle")} subtitle={t("paymentSub")} isDark={isDark} />

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label={t("deposits")} value={`${formatAmount(paymentStats.totalDeposits)} DA`} isDark={isDark} />
        <StatCard label={t("toCollect")} value={`${formatAmount(paymentStats.totalRemaining)} DA`} isDark={isDark} />
        <StatCard label={t("unpaid")} value={paymentStats.unpaidOrders} isDark={isDark} />
        <StatCard label={t("paidOrders")} value={paymentStats.paidOrders} isDark={isDark} />
      </div>

      <FilterBox isDark={isDark}>
        <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t("search")} isDark={isDark} />
        <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} isDark={isDark}>
          <option>À encaisser</option>
          <option>Soldées</option>
          <option>Tous</option>
        </Select>
      </FilterBox>

      {activeOrders.length === 0 ? (
        <Empty text={t("noPayments")} isDark={isDark} />
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <PaymentCard key={order.id} order={order} onUpdatePayment={onUpdatePayment} t={t} isDark={isDark} />
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentCard({ order, onUpdatePayment, t, isDark }) {
  const [depositValue, setDepositValue] = useState(String(order.deposit || ""));

  useEffect(() => {
    setDepositValue(String(order.deposit || ""));
  }, [order.deposit]);

  const sellingPrice = Number(order.sellingPrice || 0);
  const deposit = Number(order.deposit || 0);
  const remaining = Number(order.remaining || 0);
  const whatsappNumber = getWhatsAppNumber(order.customerPhone);
  const reminderText = encodeURIComponent(
    `Bonjour ${order.customerName}, il reste ${formatAmount(remaining)} DA à régler pour votre commande ${order.productName}. Merci.`
  );

  return (
    <div className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)}`}>
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-extrabold">{order.customerName}</h3>
          <p className={`text-sm ${muted(isDark)}`}>{order.productName}</p>
        </div>
        <span className={`rounded-full px-3 py-2 text-xs font-bold h-fit ${remaining === 0 ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
          {remaining === 0 ? t("paidFull") : t("toCollect")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
        <Mini label="Total" value={`${formatAmount(sellingPrice)} DA`} isDark={isDark} />
        <Mini label={t("paid")} value={`${formatAmount(deposit)} DA`} isDark={isDark} />
        <Mini label={t("remaining")} value={`${formatAmount(remaining)} DA`} isDark={isDark} />
      </div>

      <div className="mt-4 space-y-2">
        <Input value={depositValue} onChange={(e) => setDepositValue(e.target.value)} type="number" placeholder={t("paid")} isDark={isDark} />
        <button type="button" onClick={() => onUpdatePayment(order, depositValue)} className={primaryButton()}>{t("savePayment")}</button>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => { const v = Math.min(sellingPrice, Number(depositValue || 0) + 500); setDepositValue(String(v)); onUpdatePayment(order, v); }} className={secondaryButton(isDark)}>+500</button>
          <button type="button" onClick={() => { const v = Math.min(sellingPrice, Number(depositValue || 0) + 1000); setDepositValue(String(v)); onUpdatePayment(order, v); }} className={secondaryButton(isDark)}>+1000</button>
          <button type="button" onClick={() => { setDepositValue(String(sellingPrice)); onUpdatePayment(order, sellingPrice); }} className="bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-bold">{t("paidFull")}</button>
        </div>
        {whatsappNumber && remaining > 0 && (
          <a href={`https://wa.me/${whatsappNumber}?text=${reminderText}`} target="_blank" rel="noreferrer" className="block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-bold text-center">
            {t("whatsappReminder")}
          </a>
        )}
      </div>
    </div>
  );
}

function Delivery({ orders, onUpdateDelivery, t, isDark }) {
  const [searchText, setSearchText] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("À suivre");

  const deliveryOrders = useMemo(
    () => orders.filter((order) => order.status !== "Annulée" && order.status !== "Nouvelle"),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return deliveryOrders.filter((order) => {
      const matchesFilter =
        deliveryFilter === "Tous" ||
        (deliveryFilter === "À suivre" && order.status !== "Livrée" && order.status !== "Retour") ||
        order.status === deliveryFilter;

      const searchableText = `${order.customerName || ""} ${order.customerPhone || ""} ${order.productName || ""} ${order.deliveryCompany || ""} ${order.trackingCode || ""}`.toLowerCase();
      const matchesSearch = cleanSearch.length === 0 || searchableText.includes(cleanSearch);
      return matchesFilter && matchesSearch;
    });
  }, [deliveryOrders, searchText, deliveryFilter]);

  const deliveryStats = useMemo(() => ({
    ready: orders.filter((order) => order.status === "Reçue").length,
    inDelivery: orders.filter((order) => order.status === "En livraison").length,
    delivered: orders.filter((order) => order.status === "Livrée").length,
    returns: orders.filter((order) => order.status === "Retour").length,
  }), [orders]);

  return (
    <section>
      <SectionTitle title={t("deliveryTitle")} subtitle={t("deliverySub")} isDark={isDark} />

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label={t("ready")} value={deliveryStats.ready} isDark={isDark} />
        <StatCard label={t("inDelivery")} value={deliveryStats.inDelivery} isDark={isDark} />
        <StatCard label={t("delivered")} value={deliveryStats.delivered} isDark={isDark} />
        <StatCard label={t("returns")} value={deliveryStats.returns} isDark={isDark} />
      </div>

      <FilterBox isDark={isDark}>
        <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t("deliverySearch")} isDark={isDark} />
        <Select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} isDark={isDark}>
          <option>À suivre</option>
          <option>Tous</option>
          {DELIVERY_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
        </Select>
      </FilterBox>

      {deliveryOrders.length === 0 ? (
        <Empty text={t("noDelivery")} isDark={isDark} />
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <DeliveryCard key={order.id} order={order} onUpdateDelivery={onUpdateDelivery} t={t} isDark={isDark} />
          ))}
        </div>
      )}
    </section>
  );
}

function DeliveryCard({ order, onUpdateDelivery, t, isDark }) {
  const [form, setForm] = useState({
    status: order.status || "Confirmée",
    deliveryCompany: order.deliveryCompany || "",
    trackingCode: order.trackingCode || "",
  });

  useEffect(() => {
    setForm({
      status: order.status || "Confirmée",
      deliveryCompany: order.deliveryCompany || "",
      trackingCode: order.trackingCode || "",
    });
  }, [order.status, order.deliveryCompany, order.trackingCode]);

  const whatsappNumber = getWhatsAppNumber(order.customerPhone);
  const deliveryText = encodeURIComponent(
    `Bonjour ${order.customerName}, votre commande ${order.productName} est actuellement : ${form.status}. ${form.deliveryCompany ? `Livraison : ${form.deliveryCompany}.` : ""} ${form.trackingCode ? `Suivi : ${form.trackingCode}.` : ""}`
  );

  const handleChange = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  return (
    <div className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)} space-y-3`}>
      <div>
        <h3 className="font-extrabold">{order.customerName}</h3>
        <p className={`text-sm ${muted(isDark)}`}>{order.productName}</p>
      </div>
      <Select name="status" value={form.status} onChange={handleChange} isDark={isDark}>
        {DELIVERY_STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
      </Select>
      <Input name="deliveryCompany" value={form.deliveryCompany} onChange={handleChange} placeholder={t("deliveryCompany")} isDark={isDark} />
      <Input name="trackingCode" value={form.trackingCode} onChange={handleChange} placeholder={t("trackingCode")} isDark={isDark} />
      <button type="button" onClick={() => onUpdateDelivery(order, form)} className={primaryButton()}>
        {t("deliveryUpdate")}
      </button>
      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}?text=${deliveryText}`} target="_blank" rel="noreferrer" className="block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-bold text-center">
          {t("whatsappDelivery")}
        </a>
      )}
    </div>
  );
}

function More({ clients, t, isDark }) {
  return (
    <section>
      <SectionTitle title={t("moreTitle")} subtitle={t("moreSub")} isDark={isDark} />

      <div className="grid grid-cols-2 gap-3 mt-6">
        <LinkCard label={t("guide")} href="/guide.html" isDark={isDark} />
        <LinkCard label={t("faq")} href="/faq.html" isDark={isDark} />
        <LinkCard label={t("privacy")} href="/privacy.html" isDark={isDark} />
        <LinkCard label={t("terms")} href="/terms.html" isDark={isDark} />
        <LinkCard label={t("instagram")} href={INSTAGRAM_URL} isDark={isDark} external />
        <LinkCard label="Beta hub" href="/beta.html" isDark={isDark} />
      </div>

      <div className="mt-6">
        <ContactForm t={t} isDark={isDark} />
      </div>

      <div className="mt-6">
        <SectionTitle title={t("clients")} subtitle={t("clientsSub")} isDark={isDark} small />
        {clients.length === 0 ? (
          <Empty text={t("noClients")} isDark={isDark} />
        ) : (
          <div className="mt-4 space-y-3">
            {clients.map((client) => <ClientCard key={client.id} client={client} t={t} isDark={isDark} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function ClientCard({ client, t, isDark }) {
  const whatsappNumber = getWhatsAppNumber(client.phone);

  return (
    <div className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)}`}>
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-extrabold">{client.name}</h3>
          <p className={`text-sm ${muted(isDark)}`}>{client.phone || "Sans téléphone"}</p>
        </div>
        <span className="rounded-full bg-cyan-50 text-cyan-700 px-3 py-2 text-xs font-bold h-fit">
          {client.activeOrders} active(s)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <Mini label={t("ordersTotal")} value={client.totalOrders} isDark={isDark} />
        <Mini label={t("spent")} value={`${formatAmount(client.totalSpent)} DA`} isDark={isDark} />
        <Mini label={t("remaining")} value={`${formatAmount(client.totalRemaining)} DA`} isDark={isDark} />
        <Mini label={t("latest")} value={client.latestStatus} isDark={isDark} />
      </div>

      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-4 block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-bold text-center">
          {t("openWhatsapp")}
        </a>
      )}
    </div>
  );
}

function ContactForm({ t, isDark }) {
  const [contact, setContact] = useState({
    name: "",
    shop: "",
    whatsapp: "",
    message: "",
  });
  const [copied, setCopied] = useState(false);

  const contactText = `Bonjour ShopFlow DZ,\nNom : ${contact.name}\nBoutique : ${contact.shop}\nWhatsApp : ${contact.whatsapp}\nMessage : ${contact.message}`;

  const handleChange = (e) => {
    setCopied(false);
    setContact((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(contactText);
      setCopied(true);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <div className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)} space-y-3`}>
      <h3 className="font-extrabold">{t("contact")}</h3>
      <Input name="name" value={contact.name} onChange={handleChange} placeholder={t("contactName")} isDark={isDark} />
      <Input name="shop" value={contact.shop} onChange={handleChange} placeholder={t("contactShop")} isDark={isDark} />
      <Input name="whatsapp" value={contact.whatsapp} onChange={handleChange} placeholder={t("contactWhatsapp")} isDark={isDark} />
      <textarea
        name="message"
        value={contact.message}
        onChange={handleChange}
        placeholder={t("contactMessage")}
        className={`${inputClass(isDark)} min-h-28 resize-none`}
      />
      <button type="button" onClick={copyMessage} className={primaryButton()}>{t("copyMessage")}</button>
      {copied && <p className="text-sm text-teal-500 font-bold">{t("copied")}</p>}
      <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="block text-center bg-pink-50 text-pink-700 rounded-2xl p-3 text-sm font-bold">
        {t("openInstagram")}
      </a>
    </div>
  );
}

function OrderFields({ form, onChange, t, isDark }) {
  return (
    <>
      <Input name="customerName" value={form.customerName} onChange={onChange} placeholder={t("customer")} isDark={isDark} />
      <Input name="customerPhone" value={form.customerPhone} onChange={onChange} placeholder={t("phone")} isDark={isDark} />
      <Input name="productName" value={form.productName} onChange={onChange} placeholder={t("product")} isDark={isDark} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="sellingPrice" type="number" value={form.sellingPrice} onChange={onChange} placeholder={t("sellingPrice")} isDark={isDark} />
        <Input name="purchasePrice" type="number" value={form.purchasePrice} onChange={onChange} placeholder={t("purchasePrice")} isDark={isDark} />
      </div>
      <Input name="deposit" type="number" value={form.deposit} onChange={onChange} placeholder={t("deposit")} isDark={isDark} />
      <Select name="status" value={form.status} onChange={onChange} isDark={isDark}>
        {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input name="deliveryCompany" value={form.deliveryCompany} onChange={onChange} placeholder={t("deliveryCompany")} isDark={isDark} />
        <Input name="trackingCode" value={form.trackingCode} onChange={onChange} placeholder={t("trackingCode")} isDark={isDark} />
      </div>
      <Input name="note" value={form.note} onChange={onChange} placeholder={t("note")} isDark={isDark} />
    </>
  );
}

function Input({ isDark, className = "", ...props }) {
  return <input {...props} className={`${inputClass(isDark)} ${className}`} />;
}

function Select({ isDark, small = false, className = "", children, ...props }) {
  return (
    <select {...props} className={`${inputClass(isDark)} ${small ? "max-w-36 px-3 py-2 text-xs" : ""} ${className}`}>
      {children}
    </select>
  );
}

function Mini({ label, value, isDark }) {
  return (
    <div className={`${isDark ? "bg-white/5" : "bg-slate-100"} rounded-2xl p-3`}>
      <p className={`text-xs ${muted(isDark)}`}>{label}</p>
      <p className="font-extrabold text-sm">{value}</p>
    </div>
  );
}

function NavButton({ active, onClick, label, isDark }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 text-[11px] font-extrabold ${
        active ? "text-cyan-500" : muted(isDark)
      }`}
    >
      {label}
    </button>
  );
}

function SectionTitle({ title, subtitle, isDark, small = false }) {
  return (
    <div>
      <h2 className={`${small ? "text-xl" : "text-2xl"} font-extrabold`}>{title}</h2>
      {subtitle && <p className={`${muted(isDark)} mt-1 text-sm`}>{subtitle}</p>}
    </div>
  );
}

function FilterBox({ children, isDark }) {
  return (
    <div className={`mt-5 ${surface(isDark)} rounded-3xl p-4 shadow-sm space-y-3 border ${border(isDark)}`}>
      {children}
    </div>
  );
}

function Empty({ text, isDark }) {
  return (
    <div className={`${surface(isDark)} rounded-3xl p-6 shadow-sm text-center mt-6 border ${border(isDark)}`}>
      <p className={muted(isDark)}>{text}</p>
    </div>
  );
}

function LinkCard({ label, href, isDark, external = false }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`${surface(isDark)} rounded-3xl p-4 shadow-sm border ${border(isDark)} font-extrabold flex items-center justify-between`}
    >
      <span>{label}</span>
      <span className="text-cyan-500">›</span>
    </a>
  );
}

function surface(isDark) {
  return isDark ? "bg-white/10 backdrop-blur text-white" : "bg-white text-slate-900";
}

function border(isDark) {
  return isDark ? "border-white/10" : "border-slate-200";
}

function muted(isDark) {
  return isDark ? "text-slate-300" : "text-slate-500";
}

function activePill(isDark) {
  return isDark ? "bg-white text-slate-950 shadow-sm" : "bg-white text-slate-900 shadow-sm";
}

function inputClass(isDark) {
  return `w-full rounded-2xl p-4 outline-none ${
    isDark
      ? "bg-white/10 text-white placeholder:text-slate-400 border border-white/10"
      : "bg-slate-100 text-slate-900 placeholder:text-slate-400"
  }`;
}

function primaryButton() {
  return "w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-2xl p-3 text-sm font-extrabold";
}

function secondaryButton(isDark) {
  return `w-full rounded-2xl p-3 text-sm font-bold ${
    isDark ? "bg-white/10 text-slate-100" : "bg-slate-100 text-slate-700"
  }`;
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function getWhatsAppNumber(phone) {
  if (!phone) return "";

  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return `213${digits.slice(1)}`;
  if (digits.length === 9) return `213${digits}`;

  return digits;
}

export default AppV2;
