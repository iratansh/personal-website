import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/views.css";
import "./styles/overlays.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// For the curious ones with devtools open.
console.log(
  "%c iratansh %c Hi there. The source lives at github.com/iratansh/personal-website. Try ` for the terminal, or ⌘K.",
  "background:#34e0a1;color:#050708;font-weight:700;padding:2px 4px",
  "color:#aab7b3",
);
