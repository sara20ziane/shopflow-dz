import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./AppWithSalesAssistant.jsx";
import BusinessCalculatorPage from "./features/businessCalculator/BusinessCalculatorPage.jsx";
import { setupPwaMetadata } from "./pwa.js";

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isBusinessCalculator = ["/calculateur", "/calculateur-business", "/business-calculator"].includes(normalizedPath);
const RootApp = isBusinessCalculator ? BusinessCalculatorPage : App;

if (isBusinessCalculator) {
  document.title = "Calculateur Business DZ — NSEYER";
  const description = document.querySelector('meta[name="description"]') || document.createElement("meta");
  description.setAttribute("name", "description");
  description.setAttribute("content", "Calculateur gratuit de rentabilité pour petits business en Algérie : prix d’achat, pub, COD, livraison, retours et marge réelle.");
  if (!description.parentNode) document.head.appendChild(description);
} else {
  setupPwaMetadata();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
