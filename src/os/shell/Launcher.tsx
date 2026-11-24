import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { CornerDownLeft, Moon, Search, Sun, Keyboard, Minimize2, Settings as Cog, type LucideIcon } from "lucide-react";
import { allNodes, getNode } from "../fs";
import { useOS } from "../store";
import { useSettings } from "../settings";
import { AppIcon } from "../ui/AppIcon";
import type { FsNode } from "../types";
import { track } from "../../analytics";

type Group = "Applications" | "Folders" | "Projects" | "Documents" | "Open Source" | "Actions";
const ORDER: Group[] = ["Applications", "Projects", "Folders", "Documents", "Open Source", "Actions"];

interface Result {
  id: string;
  group: Group;
  label: string;
  hint: string;
  node?: FsNode;
  icon?: LucideIcon;
  run: () => void;
  score: number;
}

const groupOf = (n: FsNode): Group =>
  n.kind === "app"
    ? "Applications"
    : n.kind === "folder"
      ? "Folders"
      : n.id.startsWith("project:")
        ? "Projects"
        : n.id.startsWith("oss")
          ? "Open Source"
          : "Documents";

const SUGGESTED = ["resume", "projects", "app:homelab", "about", "app:terminal", "app:contact", "opensource", "skills"];

function score(q: string, label: string, extra: string[]): number {
  const l = label.toLowerCase();
  if (l.startsWith(q)) return 100 - l.length * 0.1;
  if (l.split(/[\s._-]+/).some((w) => w.startsWith(q))) return 80;
  if (l.includes(q)) return 60;
  if (extra.some((k) => k.toLowerCase().includes(q))) return 30;
  return 0;
}

function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  const i = q ? text.toLowerCase().indexOf(q) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function Launcher() {
  const os = useOS();
  const { settings, set } = useSettings();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const close = () => os.setLauncherOpen(false);

  useEffect(() => {
    track("palette_open");
    const prev = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    // Hand focus back on close, unless the chosen result opened a window that took it.
    return () => {
      window.setTimeout(() => {
        const a = document.activeElement;
        if ((!a || a === document.body) && prev?.isConnected) prev.focus({ preventScroll: true });
      }, 60);
    };
  }, []);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    const openNode = (n: FsNode) => () => {
      track("palette_select", { item: n.id });
      os.open(n.id, { source: "launcher" });
    };
    const actions: Result[] = [
      {
        id: "act:theme",
        group: "Actions",
        label: settings.theme === "dark" ? "Switch to Light Appearance" : "Switch to Dark Appearance",
        hint: "Appearance",
        icon: settings.theme === "dark" ? Sun : Moon,
        run: () => set("theme", settings.theme === "dark" ? "light" : "dark"),
        score: 0,
      },
      { id: "act:min", group: "Actions", label: "Show Desktop", hint: "Minimize every window", icon: Minimize2, run: os.minimizeAll, score: 0 },
      { id: "act:keys", group: "Actions", label: "Keyboard Shortcuts", hint: "Help", icon: Keyboard, run: () => os.open("help"), score: 0 },
      { id: "act:settings", group: "Actions", label: "Open Settings", hint: "Wallpaper, motion, sound, privacy", icon: Cog, run: () => os.open("app:settings"), score: 0 },
    ];

    if (!query) {
      return SUGGESTED.map((id) => getNode(id)!)
        .filter(Boolean)
        .map((n) => ({ id: n.id, group: groupOf(n), label: n.name, hint: n.kindLabel, node: n, run: openNode(n), score: 1 }));
    }

    const out: Result[] = [];
    for (const n of allNodes()) {
      if (n.id === "root") continue;
      const s = score(query, n.name.replace(/\.(md|txt|pdf)$/, ""), [n.kindLabel, n.description ?? "", ...(n.keywords ?? [])]);
      if (s > 0) out.push({ id: n.id, group: groupOf(n), label: n.name, hint: n.description ?? n.kindLabel, node: n, run: openNode(n), score: s });
    }
    for (const a of actions) {
      const s = score(query, a.label, [a.hint]);
      if (s > 0) out.push({ ...a, score: s });
    }
    return out.sort((a, b) => b.score - a.score || ORDER.indexOf(a.group) - ORDER.indexOf(b.group)).slice(0, 14);
  }, [q, os, settings.theme, set]);

  // Group, keeping each group's best-first order but listing groups in a stable order.
  const grouped = useMemo(() => {
    if (!q.trim()) return [{ group: "Suggested", items: results }];
    const groups = ORDER.map((g) => ({ group: g as string, items: results.filter((r) => r.group === g) })).filter((g) => g.items.length);
    return groups;
  }, [results, q]);
  const flat = grouped.flatMap((g) => g.items);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flat[active];
      if (r) {
        close();
        r.run();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let i = -1;
  return (
    <div className="launcher-scrim" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div
        className="launcher surface-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Search iratanshOS"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
        transition={{ duration: 0.18, ease: [0.2, 0.9, 0.25, 1] }}
        onKeyDown={onKey}
      >
        <div className="launcher-input">
          <Search size={18} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps, projects, documents…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="launcher-results"
            aria-activedescendant={flat[active] ? `lr-${active}` : undefined}
          />
          <kbd>esc</kbd>
        </div>
        <div className="launcher-results" id="launcher-results" role="listbox" ref={listRef}>
          {flat.length === 0 && <p className="launcher-empty">No matches for “{q}”. Try “resume”, “go”, or “kubernetes”.</p>}
          {grouped.map((g) => (
            <div key={g.group} role="group" aria-label={g.group}>
              <div className="launcher-group">{g.group}</div>
              {g.items.map((r) => {
                i++;
                const idx = i;
                return (
                  <button
                    key={r.id}
                    id={`lr-${idx}`}
                    data-i={idx}
                    role="option"
                    aria-selected={idx === active}
                    className={`launcher-item${idx === active ? " is-active" : ""}`}
                    onPointerMove={() => idx !== active && setActive(idx)}
                    onClick={() => {
                      close();
                      r.run();
                    }}
                  >
                    {r.node ? (
                      <AppIcon spec={r.node.icon} size={28} locked={r.node.locked} />
                    ) : (
                      <span className="launcher-act">{r.icon && <r.icon size={16} />}</span>
                    )}
                    <span className="launcher-text">
                      <span className="launcher-label">
                        <Highlight text={r.label} q={q.trim().toLowerCase()} />
                      </span>
                      <span className="launcher-hint">{r.hint}</span>
                    </span>
                    {idx === active && <CornerDownLeft size={14} className="launcher-enter" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
