import React from "react";
import ReactDOM from "react-dom/client";
import IratanshOS from "./os/IratanshOS";
import { initAnalytics } from "./analytics";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/os.css";
import "./styles/apps.css";
import "./styles/viz.css";

initAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IratanshOS />
  </React.StrictMode>,
);

// For the curious ones with devtools open.
console.log(
  "%c iratanshOS %c Hi there. The source lives at github.com/iratansh/personal-website. Press ⌘K, or ` for the terminal.",
  "background:#34e0a1;color:#050708;font-weight:700;padding:2px 4px",
  "color:#aab7b3",
);
