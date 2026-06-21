import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./AppV2.jsx";
import { setupPwaMetadata } from "./pwa.js";

setupPwaMetadata();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
