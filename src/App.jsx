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
  doc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

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

  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    productName: "",
    sellingPrice: "",
    purchasePrice: "",
    deposit: "",
    status: "Nouvelle",
    note: "",
  });

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
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.sellingPrice || 0),
      0
    );

    const totalPurchases = orders.reduce(
      (sum, order) => sum + Number(order.purchasePrice || 0),
      0
    );

    const totalDeposits = orders.reduce(
      (sum, order) => sum + Number(order.deposit || 0),
      0
    );

    const remaining = totalSales - totalDeposits;
    const profit = totalSales - totalPurchases;

    return {
      totalOrders: orders.length,
      totalSales,
      totalDeposits,
      remaining,
      profit,
    };
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
        note: orderForm.note.trim(),
        createdAt: serverTimestamp(),
      });

      setOrderForm({
        customerName: "",
        customerPhone: "",
        productName: "",
        sellingPrice: "",
        purchasePrice: "",
        deposit: "",
        status: "Nouvelle",
        note: "",
      });

      setMessage("Commande ajoutée avec succès.");
      setPage("orders");
    } catch (error) {
      setMessage("Erreur lors de l’ajout de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    resetMessage();

    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });

      setMessage("Statut mis à jour.");
    } catch (error) {
      setMessage("Erreur lors de la mise à jour du statut.");
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
          <Orders orders={orders} onStatusChange={handleUpdateStatus} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="max-w-md mx-auto grid grid-cols-3">
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
            label="Commandes"
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
        <StatCard label="CA total" value={`${stats.totalSales} DA`} />
        <StatCard label="Acomptes" value={`${stats.totalDeposits} DA`} />
        <StatCard label="Reste" value={`${stats.remaining} DA`} />
      </div>

      <div className="mt-4 bg-slate-900 text-white rounded-3xl p-5">
        <p className="text-sm text-slate-300">Bénéfice estimé</p>
        <p className="text-3xl font-bold mt-1">{stats.profit} DA</p>
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
      <p className="text-slate-500 mt-1">
        Ajoute une commande cliente
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          name="customerName"
          value={orderForm.customerName}
          onChange={onChange}
          placeholder="Nom de la cliente"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <input
          name="customerPhone"
          value={orderForm.customerPhone}
          onChange={onChange}
          placeholder="Téléphone"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <input
          name="productName"
          value={orderForm.productName}
          onChange={onChange}
          placeholder="Produit"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <input
          name="sellingPrice"
          value={orderForm.sellingPrice}
          onChange={onChange}
          placeholder="Prix de vente"
          type="number"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <input
          name="purchasePrice"
          value={orderForm.purchasePrice}
          onChange={onChange}
          placeholder="Prix d’achat"
          type="number"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <input
          name="deposit"
          value={orderForm.deposit}
          onChange={onChange}
          placeholder="Acompte payé"
          type="number"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        />

        <select
          name="status"
          value={orderForm.status}
          onChange={onChange}
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm"
        >
          <option>Nouvelle</option>
          <option>En attente paiement</option>
          <option>Confirmée</option>
          <option>Commandée fournisseur</option>
          <option>Reçue</option>
          <option>En livraison</option>
          <option>Livrée</option>
          <option>Annulée</option>
          <option>Retour</option>
        </select>

        <textarea
          name="note"
          value={orderForm.note}
          onChange={onChange}
          placeholder="Remarque"
          className="w-full bg-white rounded-2xl p-4 outline-none shadow-sm min-h-24"
        />

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

function Orders({ orders, onStatusChange }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900">Commandes</h2>
      <p className="text-slate-500 mt-1">Liste de tes commandes</p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm text-center mt-6">
          <p className="text-slate-500">Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {order.customerName}
                  </h3>
                  <p className="text-slate-500 text-sm">{order.productName}</p>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  className="bg-slate-100 text-slate-700 rounded-full px-3 py-2 text-xs font-semibold h-fit outline-none max-w-36"
                >
                  <option>Nouvelle</option>
                  <option>En attente paiement</option>
                  <option>Confirmée</option>
                  <option>Commandée fournisseur</option>
                  <option>Reçue</option>
                  <option>En livraison</option>
                  <option>Livrée</option>
                  <option>Annulée</option>
                  <option>Retour</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                <div className="bg-slate-100 rounded-2xl p-3">
                  <p className="text-slate-500">Prix</p>
                  <p className="font-bold">{order.sellingPrice} DA</p>
                </div>

                <div className="bg-slate-100 rounded-2xl p-3">
                  <p className="text-slate-500">Acompte</p>
                  <p className="font-bold">{order.deposit} DA</p>
                </div>

                <div className="bg-slate-100 rounded-2xl p-3">
                  <p className="text-slate-500">Reste</p>
                  <p className="font-bold">{order.remaining} DA</p>
                </div>
              </div>

              {order.customerPhone && (
                <p className="mt-3 text-sm text-slate-500">
                  Tél : {order.customerPhone}
                </p>
              )}

              {order.note && (
                <p className="mt-2 text-sm text-slate-500">
                  Note : {order.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NavButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 text-sm font-semibold ${
        active ? "text-slate-900" : "text-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default App;
