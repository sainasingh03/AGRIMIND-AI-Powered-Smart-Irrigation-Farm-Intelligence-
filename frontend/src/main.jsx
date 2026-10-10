import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./index.css";
import "./App.css";
import "./final.css";
import "./premium-pages.css";

import { FarmProvider } from "./context/FarmContext.jsx";

import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FarmProvider>
      <App />
    </FarmProvider>
  </React.StrictMode>
);