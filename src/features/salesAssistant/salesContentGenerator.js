const DEFAULT_OBJECTIONS = [
  "C’est disponible ?",
  "Le prix est négociable ?",
  "La livraison est disponible ?",
  "Pourquoi ce produit est plus cher ?",
  "Est-ce que la qualité est bonne ?",
];

function clean(value, fallback = "") {
  return String(value || "").trim() || fallback;
}

function joinParts(parts) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function availabilityText(value) {
  if (value === "rupture") return "actuellement en rupture";
  if (value === "sur commande") return "disponible sur commande";
  return "disponible";
}

function deliveryText(value, city) {
  if (value === "oui") return `Livraison disponible${city ? ` à ${city} et selon les zones` : ""}.`;
  if (value === "selon la commune") return `Livraison possible selon la commune${city ? ` à ${city}` : ""}.`;
  return "Livraison non disponible pour le moment.";
}

function toneIntro(tone) {
  const map = {
    professionnel: "avec une présentation claire et professionnelle",
    chaleureux: "avec un ton chaleureux et proche du client",
    premium: "avec une image premium et soignée",
    simple: "avec des mots simples et directs",
    urgent: "avec un message court qui pousse à commander rapidement",
  };
  return map[tone] || map.professionnel;
}

function objectiveCta(objective) {
  const map = {
    "vendre rapidement": "Commandez maintenant en message privé.",
    "présenter le produit": "Contactez-nous pour plus d’informations.",
    "annoncer une promo": "Profitez de l’offre tant qu’elle est disponible.",
    "répondre à un client": "Envoyez-nous vos informations pour confirmer la commande.",
  };
  return map[objective] || "Commande en message privé.";
}

export function generateSalesContent(formData) {
  const productName = clean(formData.productName, "ce produit");
  const category = clean(formData.category, "commerce");
  const price = clean(formData.price);
  const city = clean(formData.city);
  const promo = clean(formData.promotion);
  const strengths = clean(formData.strengths);
  const target = clean(formData.targetClient, "les clients qui cherchent un bon choix pratique");
  const availability = availabilityText(formData.availability);
  const delivery = deliveryText(formData.delivery, city);
  const tone = toneIntro(formData.tone);
  const cta = objectiveCta(formData.objective);

  const priceSentence = price ? `Prix : ${price}.` : "Prix communiqué sur demande.";
  const citySentence = city ? `Disponible à ${city}.` : "Disponible selon votre zone.";
  const promoSentence = promo ? `Offre spéciale : ${promo}.` : "";
  const strengthSentence = strengths ? `Ses points forts : ${strengths}.` : "";

  const description = joinParts([
    `Découvrez ${productName}, une solution adaptée au commerce ${category}, présentée ${tone}.`,
    `${productName} est ${availability}.`,
    strengthSentence,
    `Il convient particulièrement à ${target}.`,
    priceSentence,
    citySentence,
    delivery,
    promoSentence,
  ]);

  const whatsapp = joinParts([
    `Bonjour, oui ${productName} est ${availability}.`,
    priceSentence,
    strengthSentence,
    delivery,
    promoSentence,
    cta,
  ]);

  const socialPost = joinParts([
    `Nouveau chez nous : ${productName}.`,
    category ? `Catégorie : ${category}.` : "",
    strengthSentence,
    priceSentence,
    city ? `Disponible à ${city}.` : "",
    delivery,
    promoSentence,
    cta,
  ]);

  const objections = buildObjections({ productName, price, delivery: formData.delivery, city, strengths, availability: formData.availability, promo });

  return { description, whatsapp, socialPost, objections };
}

function buildObjections({ productName, price, delivery, city, strengths, availability, promo }) {
  const availableAnswer = availability === "rupture"
    ? `Pour le moment, ${productName} est en rupture. Nous pouvons vous prévenir dès qu’il revient disponible.`
    : availability === "sur commande"
      ? `${productName} est disponible sur commande. Envoyez-nous vos informations pour confirmer le délai.`
      : `Oui, ${productName} est disponible. Vous pouvez nous envoyer votre commune pour confirmer la commande.`;

  const priceAnswer = price
    ? `Le prix est déjà calculé au plus juste${strengths ? `, surtout avec ses avantages : ${strengths}` : ""}.`
    : "Le prix dépend de la disponibilité et des options. Envoyez-nous votre besoin exact pour confirmer.";

  const deliveryAnswer = delivery === "non"
    ? "Pour le moment, la livraison n’est pas disponible. Le retrait ou l’arrangement se fait selon la zone."
    : delivery === "selon la commune"
      ? `Oui, la livraison est possible selon la commune${city ? ` à ${city}` : ""}. Envoyez votre localisation pour confirmer.`
      : `Oui, la livraison est disponible${city ? ` à ${city} et selon les zones` : ""}.`;

  return [
    { question: DEFAULT_OBJECTIONS[0], answer: availableAnswer },
    { question: DEFAULT_OBJECTIONS[1], answer: priceAnswer },
    { question: DEFAULT_OBJECTIONS[2], answer: deliveryAnswer },
    { question: DEFAULT_OBJECTIONS[3], answer: `${productName} peut être plus cher parce qu’il est sélectionné pour sa qualité, sa disponibilité et le service proposé. ${promo ? `En plus, il y a actuellement cette offre : ${promo}.` : ""}`.trim() },
    { question: DEFAULT_OBJECTIONS[4], answer: strengths ? `Oui, la qualité est mise en avant par ces points : ${strengths}.` : "Oui, nous sélectionnons les produits avec attention et nous pouvons vous donner plus de détails avant commande." },
  ];
}
