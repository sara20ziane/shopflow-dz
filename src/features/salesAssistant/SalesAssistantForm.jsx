const CATEGORIES = [
  "Vêtements",
  "Cosmétiques",
  "Parfumerie",
  "Accessoires",
  "Téléphones",
  "Décoration",
  "Alimentation",
  "Électroménager",
  "Commerce de quartier",
  "Service",
  "Autre",
];

const AVAILABILITY = ["disponible", "rupture", "sur commande"];
const DELIVERY = ["oui", "non", "selon la commune"];
const TONES = ["professionnel", "chaleureux", "premium", "simple", "urgent"];
const OBJECTIVES = ["vendre rapidement", "présenter le produit", "annoncer une promo", "répondre à un client"];

export const EMPTY_SALES_FORM = {
  productName: "",
  category: "",
  price: "",
  availability: "disponible",
  city: "",
  delivery: "selon la commune",
  promotion: "",
  strengths: "",
  targetClient: "",
  tone: "professionnel",
  objective: "vendre rapidement",
};

export default function SalesAssistantForm({ form, setForm, onSubmit, loading }) {
  const set = (key, value) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">ShopFlow DZ</p>
        <h2 className="mt-1 text-2xl font-black text-[#07142B]">Assistant de vente IA</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Remplis quelques informations, puis génère une description, un message WhatsApp, un post réseaux sociaux et des réponses aux objections.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <Field label="Nom du produit ou service" value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder="Ex : Parfum femme 50 ml" />
        <Select label="Catégorie du commerce" value={form.category} onChange={(e) => set("category", e.target.value)} options={["", ...CATEGORIES]} placeholder="Choisir une catégorie" />
        <Field label="Prix" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Ex : 3500 DA" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Disponibilité" value={form.availability} onChange={(e) => set("availability", e.target.value)} options={AVAILABILITY} />
          <Select label="Livraison" value={form.delivery} onChange={(e) => set("delivery", e.target.value)} options={DELIVERY} />
        </div>
        <Field label="Ville ou zone" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex : Alger, Oran, Blida..." />
        <Field label="Promotion ou offre spéciale" value={form.promotion} onChange={(e) => set("promotion", e.target.value)} placeholder="Ex : Livraison offerte aujourd’hui" />
        <TextArea label="Points forts du produit" value={form.strengths} onChange={(e) => set("strengths", e.target.value)} placeholder="Ex : bonne tenue, format pratique, qualité premium" />
        <Field label="Client cible" value={form.targetClient} onChange={(e) => set("targetClient", e.target.value)} placeholder="Ex : femmes actives, mamans, étudiants..." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Ton souhaité" value={form.tone} onChange={(e) => set("tone", e.target.value)} options={TONES} />
          <Select label="Objectif" value={form.objective} onChange={(e) => set("objective", e.target.value)} options={OBJECTIVES} />
        </div>
      </div>

      <button disabled={loading} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4B4] px-4 py-4 text-sm font-black text-[#07142B] shadow-lg disabled:opacity-60">
        {loading ? "Génération..." : "Générer le contenu"}
      </button>
    </form>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <input {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400" />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <textarea {...props} rows="4" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400" />
    </label>
  );
}

function Select({ label, options, placeholder, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
      <select {...props} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400">
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || placeholder}
          </option>
        ))}
      </select>
    </label>
  );
}
