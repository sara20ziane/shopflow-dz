import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "nseyer-business-calculator-v2";

const DEFAULTS = {
  purchasePrice: 900,
  sellingPrice: 1500,
  adCostPerOrder: 300,
  packagingCost: 30,
  deliveryRate: 70,
  sourcingCost: 5,
  otherCostPerOrder: 0,
  shippingCharged: 600,
  courierDeliveryCost: 600,
  returnCost: 0,
  targetMargin: 30,
  desiredProfit: 500,
};

const money = new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 });

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
  const [advanced, setAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setValues({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {
      // Keep defaults when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setSaved(true);
      const timer = window.setTimeout(() => setSaved(false), 700);
      return () => window.clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, [values]);

  const result = useMemo(() => calculate(values), [values]);
  const isLosingMoney = result.profitPerGeneratedOrder < 0;
  const isThin = !isLosingMoney && result.expectedNetMargin < 15;

  function update(key, rawValue) {
    setValues((current) => ({ ...current, [key]: safeNumber(rawValue) }));
  }

  function reset() {
    setValues(DEFAULTS);
    setAdvanced(false);
  }

  function showResult() {
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function shareResult() {
    const text = [
      "Calcul Business DZ — NSEYER",
      `Prix de vente : ${da(values.sellingPrice)}`,
      `Taux de livraison : ${pct(values.deliveryRate)}`,
      `Bénéfice si livraison réussie : ${da(result.profitOnSuccessfulDelivery)}`,
      `Bénéfice réel moyen / vente livrée : ${da(result.realProfitPerDeliveredSale)}`,
      `Marge nette attendue : ${pct(result.expectedNetMargin)}`,
      `Prix conseillé (~${Math.round(values.targetMargin)}%) : ${da(result.targetSellingPrice)}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Calcul Business DZ — NSEYER", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Résultat copié.");
      }
    } catch {
      // User may cancel native share.
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#07142B]">
      <header className="border-b border-slate-200 bg-[#07142B] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">NSEYER</p>
            <p className="mt-1 text-sm font-bold text-slate-300">Business DZ — outil gratuit</p>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200">V1.1 beta</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-black text-cyan-700">CALCULATEUR BUSINESS DZ</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Tu vends. Bsah ch7al rak تربح vraiment ?</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Mets 5 chiffres et découvre si ton prix tient vraiment après la pub et les commandes COD qui n’arrivent pas.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Calcul rapide</h2>
                <p className="mt-1 text-sm text-slate-500">5 chiffres. Moins d’une minute.</p>
              </div>
              <button onClick={reset} className="text-sm font-black text-slate-500 underline decoration-slate-300 underline-offset-4">Réinitialiser</button>
            </div>

            <div className="mt-6 space-y-3">
              <MoneyInput label="Prix d’achat" value={values.purchasePrice} onChange={(v) => update("purchasePrice", v)} hint="Ce que le produit t’a coûté." />
              <MoneyInput label="Prix de vente" value={values.sellingPrice} onChange={(v) => update("sellingPrice", v)} />
              <MoneyInput label="Pub par commande" value={values.adCostPerOrder} onChange={(v) => update("adCostPerOrder", v)} hint="Ex : 6 000 DA de pub ÷ 20 commandes = 300 DA." />
              <MoneyInput label="Emballage / commande" value={values.packagingCost} onChange={(v) => update("packagingCost", v)} hint="Sachet, boîte, carte, scotch…" />
              <PercentInput label="Taux de livraison" value={values.deliveryRate} onChange={(v) => update("deliveryRate", v)} hint="Sur 100 colis expédiés, combien sont vraiment livrés ?" />
            </div>

            <button onClick={showResult} className="mt-5 w-full rounded-2xl bg-[#07142B] px-5 py-4 text-sm font-black text-white shadow-lg">
              Voir mon verdict ↓
            </button>

            <button
              type="button"
              onClick={() => setAdvanced((open) => !open)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-black text-slate-700"
              aria-expanded={advanced}
            >
              <span>Ajouter mes vrais frais</span>
              <span className="text-lg">{advanced ? "−" : "+"}</span>
            </button>

            {advanced && (
              <div className="mt-4 space-y-5 rounded-3xl border border-cyan-100 bg-cyan-50/40 p-4">
                <FieldGroup title="Produit & frais">
                  <MoneyInput label="Frais d’appro / unité" value={values.sourcingCost} onChange={(v) => update("sourcingCost", v)} hint="Transport fournisseur, change, commission… répartis par unité." compact />
                  <MoneyInput label="Autres frais / commande" value={values.otherCostPerOrder} onChange={(v) => update("otherCostPerOrder", v)} hint="Confirmation, plateforme, commission…" compact />
                </FieldGroup>

                <FieldGroup title="Livraison">
                  <MoneyInput label="Livraison facturée à la cliente" value={values.shippingCharged} onChange={(v) => update("shippingCharged", v)} hint="Mets 0 si tu offres la livraison." compact />
                  <MoneyInput label="Coût livraison transporteur" value={values.courierDeliveryCost} onChange={(v) => update("courierDeliveryCost", v)} hint="Coût d’une livraison réussie." compact />
                  <MoneyInput label="Frais quand le colis revient" value={values.returnCost} onChange={(v) => update("returnCost", v)} hint="Si ton transporteur ne facture rien au retour, mets 0." compact />
                </FieldGroup>

                <FieldGroup title="Ton objectif">
                  <PercentInput label="Marge nette cible" value={values.targetMargin} onChange={(v) => update("targetMargin", v)} hint="Pour calculer ton prix conseillé." compact />
                  <MoneyInput label="Bénéfice net souhaité / vente livrée" value={values.desiredProfit} onChange={(v) => update("desiredProfit", v)} hint="Après avoir absorbé les pertes COD." compact />
                </FieldGroup>
              </div>
            )}

            <p className="mt-4 text-center text-xs font-semibold text-slate-400">
              {saved ? "Chiffres sauvegardés sur ce téléphone" : "Tes données restent sur ton appareil"}
            </p>
          </section>

          <aside ref={resultRef} className="scroll-mt-4 space-y-5 lg:sticky lg:top-5 lg:self-start">
            <section className={`rounded-[2rem] p-5 text-white shadow-xl sm:p-7 ${isLosingMoney ? "bg-rose-700" : isThin ? "bg-amber-600" : "bg-[#07142B]"}`}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Verdict</p>
              <h2 className="mt-2 text-2xl font-black">
                {isLosingMoney ? "Là, rak تخسر." : isThin ? "Tu gagnes, bsah ta marge est fragile." : "Tes chiffres sont rentables."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                À {da(values.sellingPrice)}, ta marge nette attendue est d’environ <strong>{pct(result.expectedNetMargin)}</strong> après prise en compte du COD.
              </p>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">CE QUI CHANGE TOUT</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ResultCard
                  label="Si le colis est livré"
                  value={da(result.profitOnSuccessfulDelivery)}
                  note="Bénéfice de cette livraison seule."
                />
                <ResultCard
                  label="Réel moyen / vente livrée"
                  value={da(result.realProfitPerDeliveredSale)}
                  note="Après avoir absorbé les commandes non livrées."
                  emphasis
                />
              </div>
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Exemple : “prix de vente − prix d’achat” ne suffit pas. La pub et les commandes ratées sont payées même quand tu n’encaisses rien.
              </p>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Bénéfice / commande générée" value={da(result.profitPerGeneratedOrder)} />
              <ResultCard label="Marge nette attendue" value={pct(result.expectedNetMargin)} />
              <ResultCard label="Taux livraison minimum" value={pct(result.breakEvenDeliveryRate)} />
              <ResultCard label="Coût d’une commande ratée" value={da(result.lossOnFailedOrder)} />
            </div>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <h3 className="text-lg font-black">À combien vendre ?</h3>
              <div className="mt-4 space-y-3">
                <PriceRow label="Prix plancher" value={da(result.breakEvenSellingPrice)} note="En dessous, tu perds de l’argent avec ton taux de livraison actuel." />
                <PriceRow label={`Pour ~${Math.round(values.targetMargin)}% de marge`} value={da(result.targetSellingPrice)} note="Même pub, mêmes frais et même taux de livraison." highlight />
                <PriceRow label={`Pour ~${da(values.desiredProfit)} nets / vente livrée`} value={da(result.priceForDesiredProfit)} note="Objectif après avoir absorbé les pertes des commandes non livrées." />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black">Sur 100 commandes</h3>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">COD</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Livrées" value={`${result.deliveredPer100}`} />
                <Stat label="Non livrées" value={`${100 - result.deliveredPer100}`} />
                <Stat label="CA produit attendu" value={da(result.productRevenuePer100)} />
                <Stat label="Bénéfice attendu" value={da(result.profitPer100)} strong />
              </div>
              <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                Hypothèse actuelle : le produit retourné reste revendable. Si un retour te fait perdre aussi le produit, ce cas sera ajouté dans une prochaine version.
              </p>
            </section>

            <button onClick={shareResult} className="w-full rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00C4A4] px-5 py-4 text-sm font-black text-[#07142B] shadow-lg">
              Partager mon résultat
            </button>

            <section className="rounded-[2rem] border border-cyan-100 bg-cyan-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">LA SUITE</p>
              <h3 className="mt-2 text-lg font-black">Imagine ce calcul automatique sur chaque produit.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Stock, commandes, pub, retours et bénéfice réel : NSEYER est construit pour les petits business en Algérie.
              </p>
              <p className="mt-3 text-xs font-bold text-cyan-800">Version complète en préparation.</p>
            </section>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-xl font-black">Comment on calcule ?</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-600 sm:grid-cols-3">
            <Explanation number="01" title="Livraison réussie" text="On prend ce que la cliente paie et on retire produit, pub, emballage, transporteur et autres frais." />
            <Explanation number="02" title="Commande ratée" text="Tu n’encaisses pas la vente, mais la pub, l’emballage, certains frais et éventuellement le retour restent à ta charge." />
            <Explanation number="03" title="Bénéfice réel" text="On mélange les deux scénarios selon ton taux de livraison pour savoir ce que ton business gagne vraiment en moyenne." />
          </div>
        </section>

        <footer className="py-8 text-center text-xs leading-5 text-slate-400">
          Calcul indicatif de pilotage. Vérifie toujours les tarifs de ton transporteur, tes commissions et les particularités de ton activité.
        </footer>
      </section>
    </main>
  );
}

function calculate(values) {
  const purchasePrice = safeNumber(values.purchasePrice);
  const sellingPrice = safeNumber(values.sellingPrice);
  const adCost = safeNumber(values.adCostPerOrder);
  const packagingCost = safeNumber(values.packagingCost);
  const sourcingCost = safeNumber(values.sourcingCost);
  const otherCost = safeNumber(values.otherCostPerOrder);
  const shippingCharged = safeNumber(values.shippingCharged);
  const courierDeliveryCost = safeNumber(values.courierDeliveryCost);
  const returnCost = safeNumber(values.returnCost);
  const deliveryRate = clamp(safeNumber(values.deliveryRate), 0, 100) / 100;
  const targetMargin = clamp(safeNumber(values.targetMargin), 0, 90) / 100;
  const desiredProfit = safeNumber(values.desiredProfit);

  const cogs = purchasePrice + sourcingCost;
  const sunkPerOrder = packagingCost + adCost + otherCost;

  const profitOnSuccessfulDelivery =
    sellingPrice + shippingCharged - cogs - courierDeliveryCost - sunkPerOrder;

  const lossOnFailedOrder = sunkPerOrder + returnCost;

  const profitPerGeneratedOrder =
    deliveryRate * profitOnSuccessfulDelivery -
    (1 - deliveryRate) * lossOnFailedOrder;

  const realProfitPerDeliveredSale = deliveryRate > 0
    ? profitPerGeneratedOrder / deliveryRate
    : 0;

  const expectedProductRevenue = deliveryRate * sellingPrice;
  const expectedNetMargin = expectedProductRevenue > 0
    ? (profitPerGeneratedOrder / expectedProductRevenue) * 100
    : 0;

  const deliveredContributionBeforeSunk = sellingPrice + shippingCharged - cogs - courierDeliveryCost;
  const denominatorForRate = deliveredContributionBeforeSunk + returnCost;
  const rawBreakEvenRate = denominatorForRate > 0
    ? ((sunkPerOrder + returnCost) / denominatorForRate) * 100
    : 100;
  const breakEvenDeliveryRate = clamp(rawBreakEvenRate, 0, 100);

  const breakEvenSellingPrice = deliveryRate > 0
    ? cogs + courierDeliveryCost - shippingCharged + (sunkPerOrder + (1 - deliveryRate) * returnCost) / deliveryRate
    : 0;

  const marginDenominator = deliveryRate * (1 - targetMargin);
  const targetSellingPrice = marginDenominator > 0
    ? (sunkPerOrder + (1 - deliveryRate) * returnCost - deliveryRate * (shippingCharged - cogs - courierDeliveryCost)) / marginDenominator
    : breakEvenSellingPrice;

  const priceForDesiredProfit = deliveryRate > 0
    ? breakEvenSellingPrice + desiredProfit
    : 0;

  const deliveredPer100 = Math.round(deliveryRate * 100);
  const productRevenuePer100 = deliveredPer100 * sellingPrice;
  const profitPer100 = profitPerGeneratedOrder * 100;

  return {
    profitOnSuccessfulDelivery,
    lossOnFailedOrder,
    profitPerGeneratedOrder,
    realProfitPerDeliveredSale,
    expectedNetMargin,
    breakEvenDeliveryRate,
    breakEvenSellingPrice: Math.max(0, breakEvenSellingPrice),
    targetSellingPrice: Math.max(0, targetSellingPrice),
    priceForDesiredProfit: Math.max(0, priceForDesiredProfit),
    deliveredPer100,
    productRevenuePer100,
    profitPer100,
  };
}

function MoneyInput({ label, value, onChange, hint, compact = false }) {
  return (
    <label className={`block rounded-3xl border border-slate-200 bg-slate-50 ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <span className="block text-sm font-black text-slate-600">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-2xl font-black text-[#07142B] outline-none"
        />
        <span className="text-sm font-black text-slate-400">DA</span>
      </div>
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span>}
    </label>
  );
}

function PercentInput({ label, value, onChange, hint, compact = false }) {
  return (
    <label className={`block rounded-3xl border border-slate-200 bg-slate-50 ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <span className="block text-sm font-black text-slate-600">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="number"
          min="0"
          max="100"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-2xl font-black text-[#07142B] outline-none"
        />
        <span className="text-sm font-black text-slate-400">%</span>
      </div>
      {hint && <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span>}
    </label>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ResultCard({ label, value, note, emphasis = false }) {
  return (
    <div className={`rounded-3xl p-4 shadow-sm ring-1 ${emphasis ? "bg-cyan-50 ring-cyan-100" : "bg-white ring-slate-200"}`}>
      <p className="text-[11px] font-black uppercase leading-4 tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-[#07142B]">{value}</p>
      {note && <p className="mt-2 text-[11px] leading-4 text-slate-500">{note}</p>}
    </div>
  );
}

function PriceRow({ label, value, note, highlight = false }) {
  return (
    <div className={`rounded-3xl p-4 ${highlight ? "border border-cyan-100 bg-cyan-50" : "bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-black text-slate-700">{label}</p>
        <p className="shrink-0 text-lg font-black text-[#07142B]">{value}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function Stat({ label, value, strong = false }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 text-lg ${strong ? "font-black text-cyan-700" : "font-black text-[#07142B]"}`}>{value}</p>
    </div>
  );
}

function Explanation({ number, title, text }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs font-black text-cyan-700">{number}</p>
      <p className="mt-1 font-black text-[#07142B]">{title}</p>
      <p className="mt-1">{text}</p>
    </div>
  );
}
