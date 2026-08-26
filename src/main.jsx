import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./AppWithSalesAssistant.jsx";
import BusinessCalculatorPage from "./features/businessCalculator/BusinessCalculatorPage.jsx";
import { setupPwaMetadata } from "./pwa.js";

setupPwaMetadata();

const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
const isBusinessCalculator = ["/calculateur", "/calculateur-business", "/business-calculator"].includes(normalizedPath);
const RootApp = isBusinessCalculator ? BusinessCalculatorPage : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
