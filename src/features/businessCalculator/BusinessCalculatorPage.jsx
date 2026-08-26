import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nseyer-business-calculator-v1";

const DEFAULTS = {
  purchasePrice: 1200,
  sourcingCost: 0,
  packagingCost: 80,
  adCostPerOrder: 250,
  otherCostPerOrder: 0,
  sellingPrice: 2500,
  shippingCharged: 600,
  courierDeliveryCost: 600,
  returnCost: 350,
  deliveryRate: 70,
  targetMargin: 30,
};

const money = new Intl.NumberFormat("fr-DZ", {
  maximumFractionDigits: 0,
});

function da(value) {
  if (!Number.isFinite(value)) return "—";
  return `${money.format(Math.round(value))} DA`;
}

function pct(value) {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 10) / 10} %`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export default function BusinessCalculatorPage() {
  const [values, setValues] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setValues({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // Keep defaults if local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setSaved(true);
      const timer = window.setTimeout(() => setSaved(false), 900);
      return () => window.clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [values]);

  const result = useMemo(() => calculate(values), [values]);

  function update(key, rawValue) {
    const next = safeNumber(rawValue);
    setValues((current) => ({ ...current, [key]: next }));
  }

  function reset() {
    setValues(DEFAULTS);
  }

  async function shareResult() {
    const text = [
      "Calcul Business DZ",
      `Prix de vente : ${da(values.sellingPrice)}`,
      `Taux de livraison : ${pct(values.deliveryRate)}`,
      `Bénéfice estimé / commande : ${da(result.profitPerGeneratedOrder)}`,
      `Bénéfice estimé / vente livrée : ${da(result.profitPerDeliveredSale)}`,
      `Prix plancher : ${da(result.breakEvenSellingPrice)}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Calcul Business DZ", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Résultat copié.");
      }
    } catch {
      // User may cancel the share sheet.
    }
  }

  const isLosingMoney = result.profitPerGeneratedOrder < 0;
  const isThin = !isLosingMoney && result.expectedNetMargin < 15;

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#07142B]">
      <header className="border-b border-slate-200 bg-[#07142B] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">NSEYER</p>
            <p className="mt-1 text-sm font-bold text-slate-300">Business DZ — outil gratuit</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200">
            V1 beta
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black text-cyan-700">CALCULATEUR BUSINESS DZ</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">
            Tu vends. Mais ch7al rak تربح vraiment ?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Prix d’achat, pub, emballage, livraison, retours COD… mets tes vrais chiffres et regarde ce qu’il te reste réellement.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Tes chiffres</h2>
                <p className="mt-1 text-sm text-slate-500">Par commande / par article.</p>
              </div>
              <button onClick={reset} className="text-sm font-black text-slate-500 underline decoration-slate-300 underline-offset-4">
                Réinitialiser
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <FieldGroup title="Produit">
                <MoneyInput label="Prix d’achat" value={values.purchasePrice} onChange={(v) => update("purchasePrice", v)} hint="Ce que le produit t’a coûté." />
                <MoneyInput label="Frais d’appro / unité" value={values.sourcingCost} onChange={(v) => update("sourcingCost", v)} hint="Transport fournisseur, change, commission… répartis par unité." />
                <MoneyInput label="Emballage" value={values.packagingCost} onChange={(v) => update("packagingCost", v)} hint="Sachet, boîte, carte, scotch…" />
              </FieldGroup>

              <FieldGroup title="Acquisition & frais">
                <MoneyInput label="Pub par commande" value={values.adCostPerOrder} onChange={(v) => update("adCostPerOrder", v)} hint="Ex : 5 000 DA de pub / 20 commandes = 250 DA." />
                <MoneyInput label="Autres frais / commande" value={values.otherCostPerOrder} onChange={(v) => update("otherCostPerOrder", v)} hint="Confirmation, plateforme, commission ou autre coût variable." />
              </FieldGroup>

              <FieldGroup title="Vente & livraison">
                <MoneyInput label="Prix de vente produit" value={values.sellingPrice} onChange={(v) => update("sellingPrice", v)} />
                <MoneyInput label="Livraison facturée à la cliente" value={values.shippingCharged} onChange={(v) => update("shippingCharged", v)} hint="Mets 0 si tu offres la livraison." />
                <MoneyInput label="Coût livraison transporteur" value={values.courierDeliveryCost} onChange={(v) => update("courierDeliveryCost", v)} hint="Coût d’une livraison réussie." />
                <MoneyInput label="Coût d’un retour / échec" value={values.returnCost} onChange={(v) => update("returnCost", v)} hint="Ce que te coûte en moyenne une commande non livrée." />
              </FieldGroup>

              <FieldGroup title="COD & objectif">
                <PercentInput label="Taux de livraison" value={values.deliveryRate} onChange={(v) => update("deliveryRate", v)} hint="Sur 100 commandes expédiées, combien arrivent vraiment ?" />
                <PercentInput label="Marge nette cible" value={values.targetMargin} onChange={(v) => update("targetMargin", v)} hint="Objectif utilisé pour calculer un prix conseillé." />
              </FieldGroup>
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-slate-400">
              {saved ? "Chiffres sauvegardés sur ce téléphone" : "Tes données restent sur ton appareil"}
            </p>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <section className={`rounded-[2rem] p-5 text-white shadow-xl sm:p-7 ${isLosingMoney ? "bg-rose-700" : isThin ? "bg-amber-600" : "bg-[#07142B]"}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Verdict</p>
              <h2 className="mt-2 text-2xl font-black">
                {isLosingMoney ? "Rak تخسر sur ce modèle." : isThin ? "Tu gagnes, bsah la marge est fragile." : "Le modèle est rentable sur ces chiffres."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Le calcul tient compte des commandes qui ne sont pas livrées. C’est là que beaucoup de calculs “prix de vente - prix d’achat” deviennent trompeurs.
              </p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Bénéfice / commande générée" value={da(result.profitPerGeneratedOrder)} emphasis />
              <ResultCard label="Bénéfice / vente livrée" value={da(result.profitPerDeliveredSale)} />
              <ResultCard label="Marge nette attendue" value={pct(result.expectedNetMargin)} />
              <ResultCard label="Taux livraison minimum" value={pct(result.breakEvenDeliveryRate)} />
            </div>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h3 className="text-lg font-black">À combien vendre ?</h3>
              <div className="mt-4 space-y-3">
                <PriceRow label="Prix plancher" value={da(result.breakEvenSellingPrice)} note="Pour ne pas perdre d’argent avec ton taux de livraison actuel." />
                <PriceRow label={`Prix pour ~${Math.round(values.targetMargin)}% de marge`} value={da(result.targetSellingPrice)} note="Estimation avec les mêmes coûts et le même taux de livraison." highlight />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">Simulation sur 100 commandes</h3>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">COD</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Livrées" value={`${result.deliveredPer100}`} />
                <Stat label="Non livrées" value={`${100 - result.deliveredPer100}`} />
                <Stat label="CA produit attendu" value={da(result.productRevenuePer100)} />
                <Stat label="Bénéfice attendu" value={da(result.profitPer100)} strong />
              </div>
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Hypothèse V1 : un produit retourné reste revendable. Le coût du retour, la pub, l’emballage et les autres frais saisis restent perdus sur une commande non livrée.
              </p>
            </section>

            <button onClick={shareResult} className="w-full rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4A4] px-5 py-4 text-sm font-black text-[#07142B] shadow-lg">
              Partager mon résultat
            </button>

            <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Bientôt</p>
              <h3 className="mt-2 text-lg font-black">Tu veux faire ce calcul automatiquement sur tous tes produits ?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Stock, commandes, pub, retours et bénéfice réel : on prépare la suite pour les petits business en Algérie.
              </p>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Comment on calcule ?</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-3">
            <Explanation number="01" title="Commande livrée" text="On prend le prix de vente + la livraison facturée, puis on retire le produit et le coût transporteur." />
            <Explanation number="02" title="Commande non livrée" text="Pas de CA. Par contre la pub, l’emballage, les frais par commande et le coût de retour restent à ta charge." />
            <Explanation number="03" title="Taux de livraison" text="On mélange les deux scénarios selon ton vrai taux de livraison pour obtenir un bénéfice moyen réaliste." />
          </div>
        </section>

        <footer className="py-8 text-center text-xs leading-5 text-slate-400">
          Calcul indicatif pour piloter ton activité. Les tarifs transporteurs, commissions et traitements comptables peuvent varier selon ton contrat et ton activité.
        </footer>
      </section>
    </main>
  );
}

function calculate(values) {
  const purchasePrice = safeNumber(values.purchasePrice);
  const sourcingCost = safeNumber(values.sourcingCost);
  const packagingCost = safeNumber(values.packagingCost);
  const adCost = safeNumber(values.adCostPerOrder);
  const otherCost = safeNumber(values.otherCostPerOrder);
  const sellingPrice = safeNumber(values.sellingPrice);
  const shippingCharged = safeNumber(values.shippingCharged);
  const courierDeliveryCost = safeNumber(values.courierDeliveryCost);
  const returnCost = safeNumber(values.returnCost);
  const deliveryRate = clamp(safeNumber(values.deliveryRate), 0, 100) / 100;
  const targetMargin = clamp(safeNumber(values.targetMargin), 0, 90) / 100;

  const cogs = purchasePrice + sourcingCost;
  const sunkPerOrder = packagingCost + adCost + otherCost;
  const deliveredContributionBeforeSunk = sellingPrice + shippingCharged - cogs - courierDeliveryCost;

  const profitPerGeneratedOrder =
    deliveryRate * deliveredContributionBeforeSunk -
    sunkPerOrder -
    (1 - deliveryRate) * returnCost;

  const profitPerDeliveredSale = deliveryRate > 0 ? profitPerGeneratedOrder / deliveryRate : 0;
  const expectedProductRevenue = deliveryRate * sellingPrice;
  const expectedNetMargin = expectedProductRevenue > 0 ? (profitPerGeneratedOrder / expectedProductRevenue) * 100 : 0;

  const denominatorForRate = deliveredContributionBeforeSunk + returnCost;
  const rawBreakEvenRate = denominatorForRate > 0 ? ((sunkPerOrder + returnCost) / denominatorForRate) * 100 : 100;
  const breakEvenDeliveryRate = clamp(rawBreakEvenRate, 0, 100);

  const nonPriceDeliveredContribution = shippingCharged - cogs - courierDeliveryCost;
  const variableBurdenAtRate = deliveryRate > 0
    ? (sunkPerOrder + (1 - deliveryRate) * returnCost) / deliveryRate
    : 0;
  const breakEvenSellingPrice = deliveryRate > 0
    ? Math.max(0, -nonPriceDeliveredContribution + variableBurdenAtRate)
    : 0;

  const targetSellingPrice = deliveryRate > 0 && targetMargin < 1
    ? Math.max(0, breakEvenSellingPrice / (1 - targetMargin))
    : 0;

  const deliveredPer100 = Math.round(deliveryRate * 100);
  const productRevenuePer100 = deliveryRate * 100 * sellingPrice;
  const profitPer100 = profitPerGeneratedOrder * 100;

  return {
    profitPerGeneratedOrder,
    profitPerDeliveredSale,
    expectedNetMargin,
    breakEvenDeliveryRate,
    breakEvenSellingPrice,
    targetSellingPrice,
    deliveredPer100,
    productRevenuePer100,
    profitPer100,
  };
}

function FieldGroup({ title, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.13em] text-slate-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function MoneyInput({ label, value, onChange, hint }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 focus-within:border-cyan-400 focus-within:bg-white">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          inputMode="decimal"
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none"
        />
        <span className="text-sm font-black text-slate-400">DA</span>
      </div>
      {hint && <span className="mt-1 block text-[11px] leading-4 text-slate-400">{hint}</span>}
    </label>
  );
}

function PercentInput({ label, value, onChange, hint }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 focus-within:border-cyan-400 focus-within:bg-white">
      <span className="text-xs font-black text-slate-600">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          inputMode="decimal"
          type="number"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none"
        />
        <span className="text-sm font-black text-slate-400">%</span>
      </div>
      {hint && <span className="mt-1 block text-[11px] leading-4 text-slate-400">{hint}</span>}
    </label>
  );
}

function ResultCard({ label, value, emphasis = false }) {
  return (
    <div className={`rounded-3xl p-4 shadow-sm ring-1 ${emphasis ? "bg-cyan-50 ring-cyan-100" : "bg-white ring-slate-200"}`}>
      <p className="text-[11px] font-black uppercase leading-4 tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-[#07142B]">{value}</p>
    </div>
  );
}

function PriceRow({ label, value, note, highlight = false }) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? "bg-cyan-50 ring-1 ring-cyan-100" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-slate-700">{label}</p>
        <p className="text-lg font-black text-[#07142B]">{value}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function Stat({ label, value, strong = false }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 ${strong ? "text-lg" : "text-base"} font-black text-[#07142B]`}>{value}</p>
    </div>
  );
}

function Explanation({ number, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black text-cyan-700">{number}</p>
      <h3 className="mt-1 font-black text-slate-800">{title}</h3>
      <p className="mt-2">{text}</p>
    </div>
  );
}
