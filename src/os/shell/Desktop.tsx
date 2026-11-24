import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, FileText, FolderOpen, Mail } from "lucide-react";
import { DESKTOP_ITEMS, getNode } from "../fs";
import { useOS } from "../store";
import { useSettings } from "../settings";
import { AppIcon } from "../ui/AppIcon";
import { ContextMenu } from "../ui/Menu";
import { Wallpaper } from "./Wallpaper";
import { WindowFrame } from "./Window";
import { profile } from "../../data/profile";
import { experience } from "../../data/experience";
import { CELL_H, CELL_W, LEFT, TOP, itemMenu, useDesktopLayout } from "./desktopLayout";

function DesktopIcons({
  selected,
  setSelected,
  layout,
}: {
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  layout: ReturnType<typeof useDesktopLayout>;
}) {
  const os = useOS();
  const { cells, rows, place } = layout;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  // First-time visitors often single-click and wait. If no second click follows, explain once.
  const hintTimer = useRef(0);
  const HINT_KEY = "iratanshos.hinted";
  const hinted = () => {
    try {
      return !!localStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  };
  const learnedDoubleClick = () => {
    window.clearTimeout(hintTimer.current);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };
  const maybeHint = () => {
    if (hinted()) return;
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => {
      if (hinted()) return;
      learnedDoubleClick();
      os.toast("Double-click to open", "Or select an icon and press Enter. The card on the right opens the essentials in one click.");
    }, 900);
  };

  const onPointerDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelected(next);
      return;
    }
    if (!selected.has(id)) setSelected(new Set([id]));
    const el = e.currentTarget;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      el.classList.add("is-dragging");
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const up = (ev: PointerEvent) => {
      el.releasePointerCapture(e.pointerId);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.classList.remove("is-dragging");
      el.style.transform = "";
      if (!moved) {
        maybeHint();
        return;
      }
      const cur = cells[id];
      const c = Math.max(0, Math.round((cur.c * CELL_W + ev.clientX - sx) / CELL_W));
      const r = Math.min(rows - 1, Math.max(0, Math.round((cur.r * CELL_H + ev.clientY - sy) / CELL_H)));
      const occupant = Object.entries(cells).find(([k, v]) => k !== id && v.c === c && v.r === r)?.[0];
      if (occupant) place(occupant, cur); // swap
      place(id, { c, r });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (id: string) => (e: React.KeyboardEvent) => {
    const order = [...DESKTOP_ITEMS].sort((a, b) => cells[a].c - cells[b].c || cells[a].r - cells[b].r);
    const i = order.indexOf(id);
    let next: string | undefined;
    if (e.key === "Enter") return os.open(id, { source: "desktop" });
    if (e.key === "ArrowDown") next = order[i + 1];
    if (e.key === "ArrowUp") next = order[i - 1];
    if (e.key === "ArrowRight") next = order[Math.min(order.length - 1, i + rows)];
    if (e.key === "ArrowLeft") next = order[Math.max(0, i - rows)];
    if (next) {
      e.preventDefault();
      setSelected(new Set([next]));
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="desk-icons" role="group" aria-label="Desktop">
      {DESKTOP_ITEMS.map((id) => {
        const n = getNode(id)!;
        const cell = cells[id];
        return (
          <button
            key={id}
            ref={(el) => (refs.current[id] = el)}
            className={`desk-icon${selected.has(id) ? " is-selected" : ""}`}
            style={{ left: LEFT + cell.c * CELL_W, top: TOP + cell.r * CELL_H }}
            onPointerDown={onPointerDown(id)}
            onDoubleClick={() => {
              learnedDoubleClick();
              os.open(id, { source: "desktop" });
            }}
            onKeyDown={onKeyDown(id)}
            onFocus={() => !selected.has(id) && setSelected(new Set([id]))}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelected(new Set([id]));
              os.openMenu(e.clientX, e.clientY, itemMenu(os, id));
            }}
            aria-describedby={`dd-${id.replace(/:/g, "-")}`}
            title={n.description}
          >
            <AppIcon spec={n.icon} size={52} locked={n.locked} />
            <span className="desk-label">{n.name}</span>
            <span className="sr-only" id={`dd-${id.replace(/:/g, "-")}`}>
              {n.kindLabel}
              {n.locked ? ", private" : ""}. Double-click or press Enter to open.
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A small card so the important things are one click away from the moment the desktop loads. */
function WelcomeWidget() {
  const os = useOS();
  const now = experience[0];
  return (
    <aside className="widget surface-glass" aria-label="Welcome">
      <span className="widget-kicker">
        <span className="dot" /> {now.role} · {now.shortName}
      </span>
      <h1 className="widget-name">{profile.name}</h1>
      <p className="widget-role">{profile.role}</p>
      <p className="widget-intro">{profile.intro}</p>
      <div className="widget-actions">
        <button className="btn btn-primary" onClick={() => os.open("resume", { source: "widget" })}>
          <FileText size={14} /> Résumé
        </button>
        <button className="btn" onClick={() => os.open("projects", { source: "widget" })}>
          <FolderOpen size={14} /> Projects
        </button>
        <button className="btn btn-ghost" onClick={() => os.open("app:contact", { source: "widget" })}>
          <Mail size={14} /> Contact
        </button>
      </div>
      <a className="widget-link" href={profile.links.github} target="_blank" rel="noreferrer">
        github.com/{profile.handle} <ArrowUpRight size={12} />
      </a>
    </aside>
  );
}

export function Desktop() {
  const os = useOS();
  const { settings, set } = useSettings();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const layout = useDesktopLayout();
  const { reset } = layout;

  useEffect(() => {
    const onSelectAll = () => setSelected(new Set(DESKTOP_ITEMS));
    window.addEventListener("pos:select-all", onSelectAll);
    return () => window.removeEventListener("pos:select-all", onSelectAll);
  }, []);

  const background = (e: React.MouseEvent) => {
    e.preventDefault();
    os.openMenu(e.clientX, e.clientY, [
      { label: "New Files Window", onSelect: () => os.open("desktop") },
      { label: "Open Terminal", onSelect: () => os.open("app:terminal") },
      { separator: true },
      { label: "Clean Up Icons", onSelect: () => window.dispatchEvent(new Event("pos:reset-icons")) },
      { label: settings.showIcons ? "Hide Desktop Icons" : "Show Desktop Icons", onSelect: () => set("showIcons", !settings.showIcons) },
      { label: "Change Wallpaper…", onSelect: () => os.open("app:settings", { arg: "wallpaper" }) },
      { separator: true },
      { label: "About iratanshOS", onSelect: () => os.open("app:about") },
    ]);
  };

  useEffect(() => {
    window.addEventListener("pos:reset-icons", reset);
    return () => window.removeEventListener("pos:reset-icons", reset);
  }, [reset]);

  return (
    <main className="desktop" onContextMenu={background} onPointerDown={(e) => e.target === e.currentTarget && setSelected(new Set())}>
      <Wallpaper id={settings.wallpaper} />
      <div className="desk-surface" onPointerDown={() => setSelected(new Set())} />
      {settings.showIcons && <DesktopIcons selected={selected} setSelected={setSelected} layout={layout} />}
      {settings.showIcons && <WelcomeWidget />}
      {os.snapPreview && (
        <div
          className="snap-preview"
          style={{ left: os.snapPreview.x, top: os.snapPreview.y, width: os.snapPreview.w, height: os.snapPreview.h }}
        />
      )}
      <div className="win-layer">
        <AnimatePresence>
          {os.wins.map((w) => (
            <WindowFrame key={w.id} win={w} />
          ))}
        </AnimatePresence>
      </div>
      {os.menu && <ContextMenu x={os.menu.x} y={os.menu.y} items={os.menu.items} onClose={os.closeMenu} />}
    </main>
  );
}
