import { useMemo, useState } from "react";

const money = (value) => `${Math.round(Number(value || 0)).toLocaleString("fr-DZ")} DA`;

export default function AppBusinessDZ() {
  const [values, setValues] = useState({
    orders: 100,
    purchasePrice: 700,
    salePrice: 2200,
    deliveryCost: 450,
    returnCost: 250,
    confirmationCost: 0,
    adCostPerOrder: 350,
    confirmationRate: 70,
    deliveryRate: 75,
  });

  const result = useMemo(() => {
    const orders = Math.max(0, Number(values.orders) || 0);
    const confirmationRate = Math.min(100, Math.max(0, Number(values.confirmationRate) || 0)) / 100;
    const deliveryRate = Math.min(100, Math.max(0, Number(values.deliveryRate) || 0)) / 100;

    const confirmed = orders * confirmationRate;
    const delivered = confirmed * deliveryRate;
    const failedAfterConfirmation = Math.max(0, confirmed - delivered);

    const revenue = delivered * Number(values.salePrice || 0);
    const productCost = delivered * Number(values.purchasePrice || 0);
    const deliveryCost = delivered * Number(values.deliveryCost || 0);
    const returnCost = failedAfterConfirmation * Number(values.returnCost || 0);
    const confirmationCost = orders * Number(values.confirmationCost || 0);
    const adsCost = orders * Number(values.adCostPerOrder || 0);

    const totalCosts = productCost + deliveryCost + returnCost + confirmationCost + adsCost;
    const profit = revenue - totalCosts;
    const profitPerDelivered = delivered > 0 ? profit / delivered : 0;
    const netMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const nonAdCost = productCost + deliveryCost + returnCost + confirmationCost;
    const maxAdCostPerOrder = orders > 0 ? Math.max(0, (revenue - nonAdCost) / orders) : 0;

    return {
      confirmed,
      delivered,
      failedAfterConfirmation,
      revenue,
      totalCosts,
      profit,
      profitPerDelivered,
      netMargin,
      maxAdCostPerOrder,
    };
  }, [values]);

  const diagnosis = useMemo(() => {
    if (result.delivered === 0) return "Aucune commande livrée dans ce scénario. Vérifie tes taux de confirmation et de livraison.";
    if (result.profit < 0) {
      if (Number(values.adCostPerOrder) > result.maxAdCostPerOrder) {
        return `Rak tkhassar surtout à cause du coût pub. Ton coût pub maximum rentable est d’environ ${money(result.maxAdCostPerOrder)} par commande générée.`;
      }
      if (Number(values.deliveryRate) < 65) {
        return "Ton taux de livraison est trop faible. Les échecs COD mangent ta marge même si ton prix de vente paraît correct.";
      }
      return "Ce produit n’est pas rentable avec ces paramètres. Il faut augmenter le prix, réduire les coûts ou améliorer les taux COD.";
    }
    if (result.netMargin < 10) return "Tu es rentable, mais ta marge est fragile. Une petite hausse des retours ou du coût pub peut te faire passer en perte.";
    if (Number(values.deliveryRate) < 75) return "Le produit gagne de l’argent, mais ton taux de livraison reste le principal levier à améliorer.";
    return `Scénario rentable. Tu peux payer jusqu’à environ ${money(result.maxAdCostPerOrder)} de pub par commande générée avant d’atteindre ton seuil de rentabilité.`;
  }, [result, values]);

  const update = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
  };

  const fields = [
    ["orders", "Commandes générées", "Nombre de commandes reçues"],
    ["purchasePrice", "Prix d’achat produit", "Coût du produit"],
    ["salePrice", "Prix de vente", "Prix payé par le client"],
    ["deliveryCost", "Livraison réussie", "Coût transporteur si livré"],
    ["returnCost", "Échec / retour COD", "Coût moyen d’un colis non livré"],
    ["confirmationCost", "Confirmation", "Coût par commande reçue"],
    ["adCostPerOrder", "Pub par commande", "Coût pub pour générer une commande"],
    ["confirmationRate", "Taux de confirmation (%)", "Ex. 70"],
    ["deliveryRate", "Taux de livraison (%)", "Parmi les commandes confirmées"],
  ];

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="brand">BUSINESS DZ</div>
        <p className="eyebrow">Outil e-commerce Algérie</p>
        <h1>Avant de lancer ton produit, sache combien tu peux réellement gagner.</h1>
        <p className="hero-copy">Calcule ton vrai bénéfice après pub, COD, confirmation, livraison et échecs.</p>
      </section>

      <section className="calculator-grid">
        <div className="panel form-panel">
          <div className="panel-heading">
            <h2>Ton scénario</h2>
            <span>Simulation sur {values.orders || 0} commandes</span>
          </div>
          <div className="fields-grid">
            {fields.map(([key, label, help]) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <input type="number" min="0" step="any" value={values[key]} onChange={update(key)} />
                <small>{help}</small>
              </label>
            ))}
          </div>
        </div>

        <div className="panel result-panel">
          <p className="eyebrow">Résultat réel estimé</p>
          <div className={`profit ${result.profit >= 0 ? "positive" : "negative"}`}>{money(result.profit)}</div>
          <p className="profit-label">bénéfice net sur le scénario</p>

          <div className="metrics">
            <div><span>Commandes confirmées</span><strong>{result.confirmed.toFixed(1)}</strong></div>
            <div><span>Commandes livrées</span><strong>{result.delivered.toFixed(1)}</strong></div>
            <div><span>Échecs après confirmation</span><strong>{result.failedAfterConfirmation.toFixed(1)}</strong></div>
            <div><span>CA encaissé</span><strong>{money(result.revenue)}</strong></div>
            <div><span>Coûts totaux</span><strong>{money(result.totalCosts)}</strong></div>
            <div><span>Bénéfice / commande livrée</span><strong>{money(result.profitPerDelivered)}</strong></div>
            <div><span>Marge nette</span><strong>{result.netMargin.toFixed(1)}%</strong></div>
            <div className="highlight"><span>CPA pub maximum rentable</span><strong>{money(result.maxAdCostPerOrder)}</strong></div>
          </div>

          <div className={`diagnosis ${result.profit >= 0 ? "good" : "bad"}`}>
            <strong>Diagnostic Business DZ</strong>
            <p>{diagnosis}</p>
          </div>
        </div>
      </section>

      <section className="explanation">
        <h2>Pourquoi ce calcul est différent ?</h2>
        <p>Une marge “prix de vente - prix d’achat” ne suffit pas en e-commerce DZ. Ici, on tient compte de la confirmation, du taux de livraison, des échecs COD et du coût publicitaire pour voir ce qu’il reste réellement.</p>
      </section>
    </main>
  );
}
