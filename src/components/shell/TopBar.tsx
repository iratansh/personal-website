import { useRef } from "react";
import { useNexus } from "../../lib/nexus";
import { moduleById } from "../../lib/routes";
import { Icon } from "../ui/Icon";
import { track } from "../../analytics";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="wordmark" aria-label="iratansh">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="wordmark-glyph">
        <path d="M4 6l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
        <path d="M13 18h7" stroke="var(--accent-2)" strokeWidth="1.8" />
      </svg>
      {!compact && <span className="wordmark-text">iratansh</span>}
    </span>
  );
}

export function TopBar() {
  const { route, navigate, setPaletteOpen, setTerminalOpen, terminalOpen, toast } = useNexus();
  const clicks = useRef<number[]>([]);
  const mod = moduleById[route.module];
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  const onLogo = () => {
    const t = Date.now();
    clicks.current = [...clicks.current.filter((c) => t - c < 1600), t];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      track("easter_egg", { name: "logo" });
      toast("Persistent, aren't you. Try `help --all` in the terminal.", "violet");
      return;
    }
    navigate({ module: "overview" });
  };

  const segments = mod.path === "~" ? [] : mod.path.replace("~/", "").split("/");
  if (route.param) segments.push(route.param);

  return (
    <header className="topbar">
      <button className="topbar-brand" onClick={onLogo} aria-label="iratansh home">
        <Wordmark />
      </button>

      <nav className="crumbs mono" aria-label="Location">
        <span className="crumb-root">~</span>
        {segments.map((s, i) => (
          <span key={i} className="crumb">
            <span className="crumb-sep">/</span>
            {i === segments.length - 1 ? (
              <span aria-current="page">{s}</span>
            ) : (
              <button onClick={() => navigate({ module: route.module })}>{s}</button>
            )}
          </span>
        ))}
        <span className="crumb-caret" aria-hidden="true" />
      </nav>

      <div className="topbar-right">
        <button className="topbar-search" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
          <Icon name="search" size={14} />
          <span className="topbar-search-text">Search or jump to…</span>
          <span className="kbd">{isMac ? "⌘" : "Ctrl"}</span>
          <span className="kbd">K</span>
        </button>

        <button
          className="topbar-icon"
          onClick={() => setTerminalOpen((o) => !o)}
          aria-pressed={terminalOpen}
          aria-label="Toggle terminal"
          title="Terminal ( ` )"
        >
          <Icon name="terminal" />
        </button>
      </div>
    </header>
  );
}
