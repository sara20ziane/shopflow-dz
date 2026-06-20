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

function App() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [orderForm, setOrderForm] = useState(INITIAL_ORDER_FORM);

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
      const ordersData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

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

    const remaining = totalSales - totalDeposits;
    const profit = totalSales - totalPurchases;

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      deliveredOrders: orders.filter((order) => order.status === "Livrée").length,
      inDeliveryOrders: orders.filter((order) => order.status === "En livraison").length,
      readyOrders: orders.filter((order) => order.status === "Reçue").length,
      canceledOrders: orders.filter(
        (order) => order.status === "Annulée" || order.status === "Retour"
      ).length,
      totalSales,
      totalDeposits,
      remaining,
      profit,
    };
  }, [orders]);

  const clients = useMemo(() => {
    const clientsMap = new Map();

    orders.forEach((order) => {
      const name = order.customerName || "Cliente sans nom";
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
          orders: [],
        });
      }

      const client = clientsMap.get(key);
      client.totalOrders += 1;
      client.orders.push(order);

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

    return Array.from(clientsMap.values()).sort(
      (a, b) => b.latestDate - a.latestDate
    );
  }, [orders]);

  const resetMessage = () => {
    setMessage("");
  };

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

    setOrderForm((current) => ({
      ...current,
      [name]: value,
    }));
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

    if (deposit < 0) {
      setMessage("L'acompte ne peut pas être négatif.");
      return false;
    }

    if (deposit > sellingPrice) {
      setMessage("L'acompte ne peut pas dépasser le prix de vente.");
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

    if (!formData.customerName.trim()) {
      setMessage("Ajoute le nom de la cliente.");
      return false;
    }

    if (!formData.productName.trim()) {
      setMessage("Ajoute le nom du produit.");
      return false;
    }

    if (!formData.sellingPrice) {
      setMessage("Ajoute le prix de vente.");
      return false;
    }

    try {
      const sellingPrice = Number(formData.sellingPrice || 0);
      const purchasePrice = Number(formData.purchasePrice || 0);
      const deposit = Number(formData.deposit || 0);
      const remaining = sellingPrice - deposit;
      const profit = sellingPrice - purchasePrice;

      await updateDoc(doc(db, "orders", orderId), {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        productName: formData.productName.trim(),
        sellingPrice,
        purchasePrice,
        deposit,
        remaining,
        profit,
        status: formData.status,
        deliveryCompany: formData.deliveryCompany.trim(),
        trackingCode: formData.trackingCode.trim(),
        note: formData.note.trim(),
        updatedAt: serverTimestamp(),
      });

      setMessage("Commande modifiée.");
      return true;
    } catch (error) {
      setMessage("Erreur lors de la modification de la commande.");
      return false;
    }
  };

  const handleDeleteOrder = async (orderId) => {
    resetMessage();

    const confirmed = window.confirm(
      "Supprimer cette commande ? Cette action est définitive."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, "orders", orderId));
      setMessage("Commande supprimée.");
    } catch (error) {
      setMessage("Erreur lors de la suppression de la commande.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
          <Logo />

          <h1 className="mt-5 text-3xl font-bold text-slate-900 text-center">
            ShopFlow DZ
          </h1>

          <p className="mt-3 text-slate-600 leading-relaxed text-center">
            Gère tes commandes, tes acomptes, tes clientes et tes bénéfices sans cahier ni Excel.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => {
                setMode("login");
                resetMessage();
              }}
              className={`py-3 rounded-xl font-semibold ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Connexion
            </button>

            <button
              onClick={() => {
                setMode("register");
                resetMessage();
              }}
              className={`py-3 rounded-xl font-semibold ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Inscription
            </button>
          </div>

          <form
            onSubmit={mode === "login" ? handleLogin : handleRegister}
            className="mt-5 space-y-3"
          >
            {mode === "register" && (
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Nom de la boutique"
                className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
            />

            {message && <Message text={message} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-semibold disabled:opacity-60"
            >
              {loading
                ? "Chargement..."
                : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-400 text-center">
            Version beta en préparation 🇩🇿
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 max-w-md mx-auto pb-24">
      <header className="bg-white p-5 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ShopFlow DZ
            </h1>
            <p className="text-sm text-slate-500 break-all">{user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl font-semibold text-sm"
          >
            Sortir
          </button>
        </div>
      </header>

      <main className="p-5">
        {message && <Message text={message} />}

        {page === "dashboard" && <Dashboard stats={stats} />}
        {page === "add" && (
          <AddOrder
            orderForm={orderForm}
            onChange={handleOrderChange}
            onSubmit={handleAddOrder}
            loading={loading}
          />
        )}
        {page === "orders" && (
          <Orders
            orders={orders}
            onStatusChange={handleUpdateStatus}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
          />
        )}
        {page === "payments" && (
          <Payments orders={orders} onUpdatePayment={handleUpdatePayment} />
        )}
        {page === "delivery" && (
          <Delivery orders={orders} onUpdateDelivery={handleUpdateDelivery} />
        )}
        {page === "clients" && <Clients clients={clients} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-md mx-auto grid grid-cols-6">
          <NavButton
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
            label="Accueil"
          />
          <NavButton
            active={page === "add"}
            onClick={() => {
              setPage("add");
              resetMessage();
            }}
            label="Ajouter"
          />
          <NavButton
            active={page === "orders"}
            onClick={() => setPage("orders")}
            label="Cmdes"
          />
          <NavButton
            active={page === "payments"}
            onClick={() => setPage("payments")}
            label="Paiem."
          />
          <NavButton
            active={page === "delivery"}
            onClick={() => setPage("delivery")}
            label="Livr."
          />
          <NavButton
            active={page === "clients"}
            onClick={() => setPage("clients")}
            label="Clients"
          />
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 flex items-center justify-center">
      <span className="text-white text-2xl font-bold">SF</span>
    </div>
  );
}

function Message({ text }) {
  return (
    <p className="mb-4 text-sm text-center text-slate-700 bg-white rounded-2xl p-3 shadow-sm">
      {text}
    </p>
  );
}

function Dashboard({ stats }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
      <p className="text-slate-500 mt-1">Résumé de ton activité</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label="Commandes" value={stats.totalOrders} />
        <StatCard label="Actives" value={stats.activeOrders} />
        <StatCard label="Prêtes" value={stats.readyOrders} />
        <StatCard label="En livraison" value={stats.inDeliveryOrders} />
        <StatCard label="Livrées" value={stats.deliveredOrders} />
        <StatCard label="CA total" value={`${formatAmount(stats.totalSales)} DA`} />
        <StatCard label="Acomptes" value={`${formatAmount(stats.totalDeposits)} DA`} />
        <StatCard label="Reste" value={`${formatAmount(stats.remaining)} DA`} />
      </div>

      <div className="mt-4 bg-slate-900 text-white rounded-3xl p-5">
        <p className="text-sm text-slate-300">Bénéfice estimé</p>
        <p className="text-3xl font-bold mt-1">
          {formatAmount(stats.profit)} DA
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Les commandes annulées et les retours ne sont pas comptés dans le CA.
        </p>
      </div>
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function AddOrder({ orderForm, onChange, onSubmit, loading }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">
        Nouvelle commande
      </h2>
      <p className="text-slate-500 mt-1">Ajoute une commande cliente</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <OrderFields form={orderForm} onChange={onChange} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded-2xl p-4 font-semibold disabled:opacity-60"
        >
          {loading ? "Enregistrement..." : "Enregistrer la commande"}
        </button>
      </form>
    </section>
  );
}

function Orders({ orders, onStatusChange, onUpdateOrder, onDeleteOrder }) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_ORDER_FORM);

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "Tous" || order.status === statusFilter;

      const searchableText = `${order.customerName || ""} ${
        order.customerPhone || ""
      } ${order.productName || ""}`.toLowerCase();

      const matchesSearch =
        cleanSearch.length === 0 || searchableText.includes(cleanSearch);

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

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await onUpdateOrder(editingId, editForm);

    if (success) {
      stopEditing();
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Commandes</h2>
      <p className="text-slate-500 mt-1">Liste de tes commandes</p>

      <div className="mt-5 bg-white rounded-3xl p-4 shadow-sm space-y-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Rechercher cliente, téléphone ou produit"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        >
          <option>Tous</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <p className="text-sm text-slate-500">
          {filteredOrders.length} commande(s) affichée(s)
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune commande pour le moment.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune commande ne correspond au filtre.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
              {editingId === order.id ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <h3 className="font-bold text-slate-900">Modifier la commande</h3>
                  <OrderFields form={editForm} onChange={handleEditChange} />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={stopEditing}
                      className="bg-slate-100 text-slate-700 rounded-2xl p-3 text-sm font-semibold"
                    >
                      Annuler
                    </button>

                    <button
                      type="submit"
                      className="bg-slate-900 text-white rounded-2xl p-3 text-sm font-semibold"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              ) : (
                <OrderCard
                  order={order}
                  onStatusChange={onStatusChange}
                  onEdit={startEditing}
                  onDeleteOrder={onDeleteOrder}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderCard({ order, onStatusChange, onEdit, onDeleteOrder }) {
  return (
    <>
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{order.customerName}</h3>
          <p className="text-slate-500 text-sm">{order.productName}</p>
        </div>

        <select
          value={order.status}
          onChange={(e) => onStatusChange(order.id, e.target.value)}
          className="bg-slate-100 text-slate-700 rounded-full px-3 py-2 text-xs font-semibold h-fit outline-none max-w-36"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Prix</p>
          <p className="font-bold">{formatAmount(order.sellingPrice)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Acompte</p>
          <p className="font-bold">{formatAmount(order.deposit)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Reste</p>
          <p className="font-bold">{formatAmount(order.remaining)} DA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Achat</p>
          <p className="font-bold">{formatAmount(order.purchasePrice)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Bénéfice</p>
          <p className="font-bold">{formatAmount(order.profit)} DA</p>
        </div>
      </div>

      {(order.deliveryCompany || order.trackingCode) && (
        <div className="mt-3 bg-slate-50 rounded-2xl p-3 text-sm text-slate-500">
          {order.deliveryCompany && <p>Livraison : {order.deliveryCompany}</p>}
          {order.trackingCode && <p>Suivi : {order.trackingCode}</p>}
        </div>
      )}

      {order.customerPhone && (
        <p className="mt-3 text-sm text-slate-500">Tél : {order.customerPhone}</p>
      )}

      {order.note && (
        <p className="mt-2 text-sm text-slate-500">Note : {order.note}</p>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={() => onEdit(order)}
          className="w-full bg-slate-100 text-slate-700 rounded-2xl p-3 text-sm font-semibold"
        >
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onDeleteOrder(order.id)}
          className="w-full bg-red-50 text-red-600 rounded-2xl p-3 text-sm font-semibold"
        >
          Supprimer
        </button>
      </div>
    </>
  );
}

function Payments({ orders, onUpdatePayment }) {
  const [searchText, setSearchText] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("À encaisser");

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "Annulée" && order.status !== "Retour"),
    [orders]
  );

  const paymentStats = useMemo(() => {
    const totalDeposits = activeOrders.reduce(
      (sum, order) => sum + Number(order.deposit || 0),
      0
    );

    const totalRemaining = activeOrders.reduce(
      (sum, order) => sum + Number(order.remaining || 0),
      0
    );

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

      const searchableText = `${order.customerName || ""} ${
        order.customerPhone || ""
      } ${order.productName || ""}`.toLowerCase();

      const matchesSearch =
        cleanSearch.length === 0 || searchableText.includes(cleanSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeOrders, searchText, paymentFilter]);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Paiements</h2>
      <p className="text-slate-500 mt-1">Acomptes et restes à encaisser</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label="Acomptes" value={`${formatAmount(paymentStats.totalDeposits)} DA`} />
        <StatCard label="À encaisser" value={`${formatAmount(paymentStats.totalRemaining)} DA`} />
        <StatCard label="Non soldées" value={paymentStats.unpaidOrders} />
        <StatCard label="Soldées" value={paymentStats.paidOrders} />
      </div>

      <div className="mt-5 bg-white rounded-3xl p-4 shadow-sm space-y-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Rechercher cliente, téléphone ou produit"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        >
          <option>À encaisser</option>
          <option>Soldées</option>
          <option>Tous</option>
        </select>

        <p className="text-sm text-slate-500">
          {filteredOrders.length} commande(s) affichée(s)
        </p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucun paiement à suivre pour le moment.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucun paiement ne correspond au filtre.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <PaymentCard
              key={order.id}
              order={order}
              onUpdatePayment={onUpdatePayment}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PaymentCard({ order, onUpdatePayment }) {
  const [depositValue, setDepositValue] = useState(String(order.deposit || ""));

  useEffect(() => {
    setDepositValue(String(order.deposit || ""));
  }, [order.deposit]);

  const sellingPrice = Number(order.sellingPrice || 0);
  const deposit = Number(order.deposit || 0);
  const remaining = Number(order.remaining || 0);
  const currentInputDeposit = Number(depositValue || 0);
  const whatsappNumber = getWhatsAppNumber(order.customerPhone);
  const reminderText = encodeURIComponent(
    `Bonjour ${order.customerName}, il reste ${formatAmount(remaining)} DA à régler pour votre commande ${order.productName}. Merci.`
  );

  const updateDeposit = async (newValue) => {
    const safeValue = Math.max(0, Math.min(sellingPrice, Number(newValue || 0)));
    setDepositValue(String(safeValue));
    await onUpdatePayment(order, safeValue);
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{order.customerName}</h3>
          <p className="text-slate-500 text-sm">{order.productName}</p>
        </div>

        <span
          className={`rounded-full px-3 py-2 text-xs font-semibold h-fit ${
            remaining === 0
              ? "bg-green-50 text-green-700"
              : "bg-orange-50 text-orange-700"
          }`}
        >
          {remaining === 0 ? "Soldée" : "À encaisser"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Total</p>
          <p className="font-bold">{formatAmount(sellingPrice)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Payé</p>
          <p className="font-bold">{formatAmount(deposit)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Reste</p>
          <p className="font-bold">{formatAmount(remaining)} DA</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <input
          value={depositValue}
          onChange={(e) => setDepositValue(e.target.value)}
          type="number"
          placeholder="Montant total payé"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <button
          type="button"
          onClick={() => onUpdatePayment(order, depositValue)}
          className="w-full bg-slate-900 text-white rounded-2xl p-3 text-sm font-semibold"
        >
          Enregistrer paiement
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateDeposit(currentInputDeposit + 500)}
            className="bg-slate-100 text-slate-700 rounded-2xl p-3 text-sm font-semibold"
          >
            +500
          </button>

          <button
            type="button"
            onClick={() => updateDeposit(currentInputDeposit + 1000)}
            className="bg-slate-100 text-slate-700 rounded-2xl p-3 text-sm font-semibold"
          >
            +1000
          </button>

          <button
            type="button"
            onClick={() => updateDeposit(sellingPrice)}
            className="bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-semibold"
          >
            Soldée
          </button>
        </div>

        {whatsappNumber && remaining > 0 && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${reminderText}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-semibold text-center"
          >
            Relancer sur WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function Delivery({ orders, onUpdateDelivery }) {
  const [searchText, setSearchText] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("À suivre");

  const deliveryOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== "Annulée" && order.status !== "Nouvelle"
      ),
    [orders]
  );

  const deliveryStats = useMemo(() => {
    return {
      ready: orders.filter((order) => order.status === "Reçue").length,
      inDelivery: orders.filter((order) => order.status === "En livraison").length,
      delivered: orders.filter((order) => order.status === "Livrée").length,
      returns: orders.filter((order) => order.status === "Retour").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return deliveryOrders.filter((order) => {
      const matchesFilter =
        deliveryFilter === "Tous" ||
        (deliveryFilter === "À suivre" &&
          order.status !== "Livrée" &&
          order.status !== "Retour") ||
        order.status === deliveryFilter;

      const searchableText = `${order.customerName || ""} ${
        order.customerPhone || ""
      } ${order.productName || ""} ${order.deliveryCompany || ""} ${
        order.trackingCode || ""
      }`.toLowerCase();

      const matchesSearch =
        cleanSearch.length === 0 || searchableText.includes(cleanSearch);

      return matchesFilter && matchesSearch;
    });
  }, [deliveryOrders, searchText, deliveryFilter]);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Livraison</h2>
      <p className="text-slate-500 mt-1">Suivi des colis et statuts livraison</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard label="Prêtes" value={deliveryStats.ready} />
        <StatCard label="En livraison" value={deliveryStats.inDelivery} />
        <StatCard label="Livrées" value={deliveryStats.delivered} />
        <StatCard label="Retours" value={deliveryStats.returns} />
      </div>

      <div className="mt-5 bg-white rounded-3xl p-4 shadow-sm space-y-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Rechercher cliente, produit, société ou suivi"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <select
          value={deliveryFilter}
          onChange={(e) => setDeliveryFilter(e.target.value)}
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        >
          <option>À suivre</option>
          <option>Tous</option>
          {DELIVERY_STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <p className="text-sm text-slate-500">
          {filteredOrders.length} commande(s) affichée(s)
        </p>
      </div>

      {deliveryOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune livraison à suivre pour le moment.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune livraison ne correspond au filtre.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <DeliveryCard
              key={order.id}
              order={order}
              onUpdateDelivery={onUpdateDelivery}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DeliveryCard({ order, onUpdateDelivery }) {
  const [deliveryForm, setDeliveryForm] = useState({
    status: order.status || "Confirmée",
    deliveryCompany: order.deliveryCompany || "",
    trackingCode: order.trackingCode || "",
  });

  useEffect(() => {
    setDeliveryForm({
      status: order.status || "Confirmée",
      deliveryCompany: order.deliveryCompany || "",
      trackingCode: order.trackingCode || "",
    });
  }, [order.status, order.deliveryCompany, order.trackingCode]);

  const whatsappNumber = getWhatsAppNumber(order.customerPhone);
  const deliveryText = encodeURIComponent(
    `Bonjour ${order.customerName}, votre commande ${order.productName} est ${deliveryForm.status.toLowerCase()}. ${deliveryForm.deliveryCompany ? `Livraison : ${deliveryForm.deliveryCompany}.` : ""} ${deliveryForm.trackingCode ? `Code suivi : ${deliveryForm.trackingCode}.` : ""} Merci.`
  );

  const updateField = (name, value) => {
    setDeliveryForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveDelivery = async () => {
    await onUpdateDelivery(order, deliveryForm);
  };

  const quickStatus = async (status) => {
    const nextForm = {
      ...deliveryForm,
      status,
    };

    setDeliveryForm(nextForm);
    await onUpdateDelivery(order, nextForm);
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <div className="flex justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{order.customerName}</h3>
          <p className="text-slate-500 text-sm">{order.productName}</p>
        </div>

        <span className="bg-slate-100 text-slate-700 rounded-full px-3 py-2 text-xs font-semibold h-fit">
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Total</p>
          <p className="font-bold">{formatAmount(order.sellingPrice)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Reste</p>
          <p className="font-bold">{formatAmount(order.remaining)} DA</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <select
          value={deliveryForm.status}
          onChange={(e) => updateField("status", e.target.value)}
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        >
          {DELIVERY_STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <input
          value={deliveryForm.deliveryCompany}
          onChange={(e) => updateField("deliveryCompany", e.target.value)}
          placeholder="Société de livraison"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <input
          value={deliveryForm.trackingCode}
          onChange={(e) => updateField("trackingCode", e.target.value)}
          placeholder="Code suivi / tracking"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <button
          type="button"
          onClick={saveDelivery}
          className="w-full bg-slate-900 text-white rounded-2xl p-3 text-sm font-semibold"
        >
          Enregistrer suivi
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickStatus("En livraison")}
            className="bg-orange-50 text-orange-700 rounded-2xl p-3 text-xs font-semibold"
          >
            En livraison
          </button>

          <button
            type="button"
            onClick={() => quickStatus("Livrée")}
            className="bg-green-50 text-green-700 rounded-2xl p-3 text-xs font-semibold"
          >
            Livrée
          </button>

          <button
            type="button"
            onClick={() => quickStatus("Retour")}
            className="bg-red-50 text-red-600 rounded-2xl p-3 text-xs font-semibold"
          >
            Retour
          </button>
        </div>

        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${deliveryText}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-semibold text-center"
          >
            Informer la cliente sur WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function Clients({ clients }) {
  const [searchText, setSearchText] = useState("");

  const filteredClients = useMemo(() => {
    const cleanSearch = searchText.toLowerCase().trim();

    return clients.filter((client) => {
      const searchableText = `${client.name || ""} ${client.phone || ""}`.toLowerCase();
      return cleanSearch.length === 0 || searchableText.includes(cleanSearch);
    });
  }, [clients, searchText]);

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
      <p className="text-slate-500 mt-1">Liste automatique depuis tes commandes</p>

      <div className="mt-5 bg-white rounded-3xl p-4 shadow-sm space-y-3">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Rechercher cliente ou téléphone"
          className="w-full bg-slate-100 rounded-2xl p-4 outline-none"
        />

        <p className="text-sm text-slate-500">
          {filteredClients.length} cliente(s) affichée(s)
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune cliente pour le moment.</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune cliente ne correspond à la recherche.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </section>
  );
}

function ClientCard({ client }) {
  const whatsappNumber = getWhatsAppNumber(client.phone);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{client.name}</h3>
          {client.phone ? (
            <p className="text-sm text-slate-500">{client.phone}</p>
          ) : (
            <p className="text-sm text-slate-400">Téléphone non renseigné</p>
          )}
        </div>

        <span className="bg-slate-100 text-slate-700 rounded-full px-3 py-2 text-xs font-semibold">
          {client.latestStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Commandes</p>
          <p className="font-bold">{client.totalOrders}</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Actives</p>
          <p className="font-bold">{client.activeOrders}</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Total</p>
          <p className="font-bold">{formatAmount(client.totalSpent)} DA</p>
        </div>

        <div className="bg-slate-100 rounded-2xl p-3">
          <p className="text-slate-500">Reste</p>
          <p className="font-bold">{formatAmount(client.totalRemaining)} DA</p>
        </div>
      </div>

      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block w-full bg-green-50 text-green-700 rounded-2xl p-3 text-sm font-semibold text-center"
        >
          Contacter sur WhatsApp
        </a>
      )}
    </div>
  );
}

function OrderFields({ form, onChange }) {
  return (
    <>
      <input
        name="customerName"
        value={form.customerName}
        onChange={onChange}
        placeholder="Nom de la cliente"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="customerPhone"
        value={form.customerPhone}
        onChange={onChange}
        placeholder="Téléphone"
        type="tel"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="productName"
        value={form.productName}
        onChange={onChange}
        placeholder="Produit"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="sellingPrice"
        value={form.sellingPrice}
        onChange={onChange}
        placeholder="Prix de vente"
        type="number"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="purchasePrice"
        value={form.purchasePrice}
        onChange={onChange}
        placeholder="Prix d'achat"
        type="number"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="deposit"
        value={form.deposit}
        onChange={onChange}
        placeholder="Acompte payé"
        type="number"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <select
        name="status"
        value={form.status}
        onChange={onChange}
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>

      <input
        name="deliveryCompany"
        value={form.deliveryCompany}
        onChange={onChange}
        placeholder="Société de livraison"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <input
        name="trackingCode"
        value={form.trackingCode}
        onChange={onChange}
        placeholder="Code suivi / tracking"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
      />

      <textarea
        name="note"
        value={form.note}
        onChange={onChange}
        placeholder="Remarque"
        className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm min-h-24"
      />
    </>
  );
}

function NavButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 text-[10px] font-semibold ${
        active ? "text-slate-900" : "text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function getWhatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("213")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `213${digits.slice(1)}`;
  }

  return digits;
}

export default App;
