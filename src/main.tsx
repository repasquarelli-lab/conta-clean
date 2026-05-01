import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ---------- Service Worker (PWA) ----------
// Registra apenas em produção e fora de iframes/preview do Lovable,
// para não interferir com hot-reload nem cachear builds antigos no editor.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.dev") ||
  host === "localhost" ||
  host === "127.0.0.1";

if ("serviceWorker" in navigator) {
  if (isInIframe || isPreviewHost) {
    // Garante limpeza de qualquer SW antigo em ambiente de preview
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    });
  }
}
