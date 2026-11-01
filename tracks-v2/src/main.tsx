import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Providers } from "./app/providers";
import { applyDesign, getDesign, getMode, hydrateDesign } from "./design/theme";
import "./styles/globals.css";

hydrateDesign();
applyDesign(document, getDesign(), getMode());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
