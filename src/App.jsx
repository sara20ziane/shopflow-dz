import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";

function App() {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState(null);
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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
    setMessage("Déconnexion réussie.");
  };

  if (user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">SF</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 text-center">
            Bienvenue
          </h1>

          <p className="mt-2 text-slate-500 text-center">
            Tu es connectée à ShopFlow DZ.
          </p>

          <div className="mt-6 bg-slate-100 rounded-2xl p-4">
            <p className="text-sm text-slate-500">Compte connecté</p>
            <p className="font-semibold text-slate-900 break-all">
              {user.email}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-slate-100 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Commandes</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4">
              <p className="text-sm text-slate-500">Reste à encaisser</p>
              <p className="text-2xl font-bold text-slate-900">0 DA</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-red-50 text-red-600 py-4 rounded-2xl font-semibold"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">SF</span>
        </div>

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

          {message && (
            <p className="text-sm text-center text-slate-600 bg-slate-100 rounded-2xl p-3">
              {message}
            </p>
          )}

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

export default App;
