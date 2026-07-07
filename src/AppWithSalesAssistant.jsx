import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import AppUxClean from "./AppUxClean.jsx";
import { auth, db } from "./firebase";
import SalesAssistantPage from "./features/salesAssistant/SalesAssistantPage.jsx";

const ADMIN_EMAILS = ["sara20ziane@gmail.com"];

function dateValue(value) {
  if (!value) return null;
  if (value.seconds) return new Date(value.seconds * 1000);
  if (value.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function subscriptionState(user, profile) {
  const email = String(user?.email || "").toLowerCase();
  const isAdmin = profile?.isAdmin === true || ADMIN_EMAILS.includes(email);
  if (isAdmin) return { allowed: true, label: "Admin", reason: "admin" };

  const status = profile?.subscriptionStatus || "pending";
  const paidUntil = dateValue(profile?.paidUntil || profile?.expiresAt);
  const expiredByDate = paidUntil ? paidUntil.getTime() < Date.now() : false;

  if (status === "blocked") return { allowed: false, label: "Bloqué", reason: "blocked", paidUntil };
  if (status === "expired" || expiredByDate) return { allowed: false, label: "Expiré", reason: "expired", paidUntil };
  if (["active", "trial"].includes(status)) return { allowed: true, label: status === "trial" ? "Essai" : "Actif", reason: status, paidUntil };

  return { allowed: false, label: "En attente", reason: "pending", paidUntil };
}

export default function AppWithSalesAssistant() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    setProfile(null);
    setOpen(false);
    if (!user) {
      setSubscriptionLoading(false);
      return undefined;
    }

    setSubscriptionLoading(true);
    const q = query(collection(db, "orders"), where("userId", "==", user.uid), where("recordType", "==", "profile"));
    return onSnapshot(q, (snap) => {
      const profiles = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      profiles.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProfile(profiles[0] || null);
      setSubscriptionLoading(false);
    }, () => setSubscriptionLoading(false));
  }, [user]);

  const access = useMemo(() => subscriptionState(user, profile), [user, profile]);
  const hasAccess = !!user && !subscriptionLoading && access.allowed;
  const shouldBlock = !!user && !subscriptionLoading && !access.allowed;

  return (
    <>
      <AppUxClean />

      {user && subscriptionLoading && <SubscriptionLoading />}
      {shouldBlock && <SubscriptionBlocked user={user} profile={profile} access={access} />}

      {hasAccess && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-40 left-4 z-[9998] rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-3 text-sm font-black text-[#07142B] shadow-2xl"
        >
          Assistant IA
        </button>
      )}

      {hasAccess && open && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[#F5F8FC]">
          <SalesAssistantPage user={user} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function SubscriptionLoading() {
  return (
    <div className="fixed inset-0 z-[10001] grid place-items-center bg-[#F5F8FC] px-5 text-[#07142B]">
      <div className="rounded-[2rem] bg-white p-6 text-center shadow-2xl">
        <p className="text-sm font-black">Vérification de l’accès...</p>
      </div>
    </div>
  );
}

function SubscriptionBlocked({ user, profile, access }) {
  const paidUntil = access.paidUntil ? access.paidUntil.toLocaleDateString("fr-FR") : null;
  const title = access.reason === "expired" ? "Abonnement expiré" : access.reason === "blocked" ? "Compte bloqué" : "Compte en attente d’activation";
  const text = access.reason === "expired"
    ? "Ton accès ShopFlow DZ est suspendu jusqu’au renouvellement."
    : access.reason === "blocked"
      ? "Ce compte ne peut pas accéder à ShopFlow DZ pour le moment."
      : "Ton compte est créé. Il reste seulement l’activation après paiement.";

  return (
    <div className="fixed inset-0 z-[10001] overflow-y-auto bg-[#F5F8FC] px-5 py-8 text-[#07142B]">
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">ShopFlow DZ</p>
        <h1 className="mt-2 text-2xl font-black">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>

        <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p><strong>Boutique :</strong> {profile?.shopName || "Non renseignée"}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Statut :</strong> {access.label}</p>
          {profile?.plan && <p><strong>Plan :</strong> {profile.plan}</p>}
          {paidUntil && <p><strong>Payé jusqu’au :</strong> {paidUntil}</p>}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-500">Mensuel</p>
            <p className="mt-1 text-xl font-black">1 000 DA</p>
          </div>
          <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-500">Annuel</p>
            <p className="mt-1 text-xl font-black">10 000 DA</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-100 p-4 text-sm leading-6 text-slate-600">
          <p className="font-black text-[#07142B]">Comment activer ?</p>
          <p>1. Paie par CCP / BaridiMob.</p>
          <p>2. Envoie la preuve avec ton email : <strong>{user.email}</strong>.</p>
          <p>3. Le compte sera activé manuellement.</p>
        </div>

        <div className="mt-5 space-y-3">
          <a href="mailto:sara20ziane@gmail.com?subject=Activation%20ShopFlow%20DZ" className="block rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-4 text-center text-sm font-black text-[#07142B] shadow-lg">
            Envoyer la preuve par email
          </a>
          <a href="https://www.instagram.com/shopflowdz/" target="_blank" rel="noreferrer" className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-black text-[#07142B]">
            Contacter sur Instagram
          </a>
          <button type="button" onClick={() => signOut(auth)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-black text-slate-600">
            Se déconnecter
          </button>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-slate-400">Activation manuelle pendant la phase de lancement. Paiement automatique prévu plus tard.</p>
      </div>
    </div>
  );
}
