import { Component, Suspense, useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { APPS } from "../apps";
import { MENU_H, desktopRect, geometryOf, useOS, type Rect } from "../store";
import { useViewport } from "../hooks";
import type { Win, WinMode } from "../types";
import { AppIcon } from "../ui/AppIcon";
import { getNode } from "../fs";
import { Loading } from "../ui/Loading";

const EDGE = 6;
type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const DIRS: Dir[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="win-error">
          <strong>This window hit an error.</strong>
          <p>{this.state.error.message}</p>
          <button className="btn" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    return this.props.children;
  }
}

/** Which snap zone (if any) the pointer is in while dragging a window. */
function snapZone(x: number, y: number): WinMode | null {
  if (y <= MENU_H + 2) return "max";
  if (x <= 3) return "left";
  if (x >= window.innerWidth - 3) return "right";
  return null;
}

export function WindowFrame({ win }: { win: Win }) {
  const os = useOS();
  useViewport(); // re-render on resize so maximized/tiled windows track the viewport
  const def = APPS[win.app];
  const App = def.component;
  const focused = os.focusId === win.id;
  const ref = useRef<HTMLDivElement>(null);
  const g = geometryOf(win);
  const min = def.minSize ?? { w: 360, h: 240 };

  useEffect(() => {
    const el = ref.current as (HTMLDivElement & { inert?: boolean }) | null;
    if (el) el.inert = win.minimized;
  }, [win.minimized]);

  // The window in front owns keyboard focus, unless focus is already somewhere inside it.
  useEffect(() => {
    const el = ref.current;
    if (!focused || win.minimized || !el || el.contains(document.activeElement)) return;
    const id = requestAnimationFrame(() => {
      if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [focused, win.minimized]);

  const apply = (r: Rect) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
    el.style.width = `${r.w}px`;
    el.style.height = `${r.h}px`;
  };

  /* ---- Move ---- */
  const onBarDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    os.focus(win.id);
    const el = ref.current!;
    const start = { px: e.clientX, py: e.clientY, ...g };
    let rect: Rect = { ...g };
    let moved = false;
    let zone: WinMode | null = null;

    // Capture only once a drag actually starts, so clicks and double-clicks still reach the title bar.
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) {
        moved = true;
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
        // Pulling a maximized/tiled window off the edge restores its normal size under the pointer.
        if (win.mode !== "normal") {
          const ratio = (start.px - start.x) / start.w;
          start.w = win.w;
          start.h = win.h;
          start.x = start.px - win.w * ratio;
        }
      }
      const d = desktopRect();
      rect = {
        x: Math.min(Math.max(start.x + dx, -start.w + 80), window.innerWidth - 80),
        y: Math.min(Math.max(start.y + dy, MENU_H), d.y + d.h - 36),
        w: start.w,
        h: start.h,
      };
      apply(rect);
      const z = snapZone(ev.clientX, ev.clientY);
      if (z !== zone) {
        zone = z;
        os.setSnapPreview(z ? geometryOf({ ...win, mode: z }) : null);
      }
    };
    const up = () => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.classList.remove("is-dragging");
      os.setSnapPreview(null);
      if (!moved) return;
      if (zone) os.setMode(win.id, zone);
      else os.commitRect(win.id, rect);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* ---- Resize ---- */
  const onEdgeDown = (dir: Dir) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    os.focus(win.id);
    const el = ref.current!;
    const target = e.currentTarget as HTMLElement;
    const start = { px: e.clientX, py: e.clientY, ...g };
    let rect: Rect = { ...g };
    el.classList.add("is-dragging");
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      const r = { ...start };
      if (dir.includes("e")) r.w = Math.max(min.w, start.w + dx);
      if (dir.includes("s")) r.h = Math.max(min.h, start.h + dy);
      if (dir.includes("w")) {
        r.w = Math.max(min.w, start.w - dx);
        r.x = start.x + start.w - r.w;
      }
      if (dir.includes("n")) {
        r.h = Math.max(min.h, start.h - dy);
        r.y = Math.max(MENU_H, start.y + start.h - r.h);
        r.h = start.y + start.h - r.y;
      }
      rect = { x: r.x, y: r.y, w: r.w, h: r.h };
      apply(rect);
    };
    const up = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
      el.classList.remove("is-dragging");
      os.commitRect(win.id, rect);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  };

  const node = win.arg ? getNode(win.arg) : undefined;
  const icon = win.app === "reader" || win.app === "files" ? node?.icon ?? def.icon : def.icon;
  const toDock = window.innerHeight - g.y - g.h / 2;

  return (
    <div
      ref={ref}
      className={`win mode-${win.mode}${focused ? " is-focused" : ""}${win.minimized ? " is-min" : ""}`}
      style={{ transform: `translate3d(${g.x}px, ${g.y}px, 0)`, width: g.w, height: g.h, zIndex: win.z }}
      role="dialog"
      aria-label={win.title}
      tabIndex={-1}
      aria-hidden={win.minimized || undefined}
      onPointerDownCapture={() => !focused && os.focus(win.id)}
      data-track-source={win.app}
    >
      <motion.div
        className="win-inner"
        initial={{ opacity: 0, scale: 0.965, y: 10 }}
        animate={
          win.minimized
            ? { opacity: 0, scale: 0.3, y: toDock, transitionEnd: { visibility: "hidden" } }
            : { opacity: 1, scale: 1, y: 0, visibility: "visible" }
        }
        exit={{ opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.14 } }}
        transition={{ duration: win.minimized ? 0.32 : 0.22, ease: [0.2, 0.9, 0.25, 1] }}
      >
        <header className="win-bar" onPointerDown={onBarDown} onDoubleClick={() => os.toggleMax(win.id)}>
          <div className="win-controls">
            <button className="wc wc-close" onClick={() => os.close(win.id)} aria-label={`Close ${win.title}`} title="Close">
              <X size={9} strokeWidth={3} />
            </button>
            <button className="wc wc-min" onClick={() => os.minimize(win.id)} aria-label={`Minimize ${win.title}`} title="Minimize">
              <Minus size={9} strokeWidth={3} />
            </button>
            <button
              className="wc wc-max"
              onClick={() => os.toggleMax(win.id)}
              aria-label={win.mode === "max" ? `Restore ${win.title}` : `Maximize ${win.title}`}
              title={win.mode === "max" ? "Restore" : "Maximize"}
            >
              {win.mode === "max" ? <Minimize2 size={8} strokeWidth={3} /> : <Maximize2 size={8} strokeWidth={3} />}
            </button>
          </div>
          <div className="win-title">
            <AppIcon spec={icon} size={16} />
            <span>{win.title}</span>
          </div>
        </header>
        <div className="win-body">
          <Boundary>
            <Suspense fallback={<Loading />}>
              <App win={win} arg={win.arg} />
            </Suspense>
          </Boundary>
        </div>
      </motion.div>
      {win.mode === "normal" &&
        !win.minimized &&
        DIRS.map((d) => <div key={d} className={`win-edge e-${d}`} style={{ ["--edge" as string]: `${EDGE}px` }} onPointerDown={onEdgeDown(d)} />)}
    </div>
  );
}
