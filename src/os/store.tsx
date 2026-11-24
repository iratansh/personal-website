/* eslint-disable react-refresh/only-export-components */
/**
 * Window manager. A reducer owns every window's app, argument, geometry, mode, and stacking
 * order; components call the actions exposed by useOS(). Dragging and resizing move the DOM
 * directly and commit here once, on release, so a drag never re-renders the desktop.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APPS } from "./apps";
import { NODE_PATHS, getNode } from "./fs";
import { pathToNode } from "./paths";
import { playCue, useSettings } from "./settings";
import type { AppId, Win, WinMode } from "./types";
import { track, trackPageview } from "../analytics";
import type { MenuItem } from "./ui/Menu";

export const MENU_H = 30;
export const DOCK_H = 86;
export const BASE = import.meta.env.BASE_URL; // "/personal-website/"

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The area windows live in: below the menu bar, above the dock. */
export function desktopRect(): Rect {
  return { x: 0, y: MENU_H, w: window.innerWidth, h: Math.max(200, window.innerHeight - MENU_H - DOCK_H) };
}

/** Where a window actually renders, given its mode. */
export function geometryOf(win: Win): Rect {
  const d = desktopRect();
  const gap = 6;
  switch (win.mode) {
    case "max":
      return { x: 0, y: d.y, w: d.w, h: d.h };
    case "left":
      return { x: gap, y: d.y + gap, w: d.w / 2 - gap * 1.5, h: d.h - gap * 2 };
    case "right":
      return { x: d.w / 2 + gap / 2, y: d.y + gap, w: d.w / 2 - gap * 1.5, h: d.h - gap * 2 };
    default:
      return { x: win.x, y: win.y, w: win.w, h: win.h };
  }
}

/* ---- Reducer ---- */
interface State {
  wins: Win[];
  z: number;
}

type Action =
  | { type: "open"; win: Win }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "minimize"; id: string }
  | { type: "mode"; id: string; mode: WinMode }
  | { type: "rect"; id: string; rect: Rect }
  | { type: "arg"; id: string; arg?: string; title: string }
  | { type: "minimizeAll" }
  | { type: "closeAll" };

function reducer(s: State, a: Action): State {
  const map = (id: string, f: (w: Win) => Win) => s.wins.map((w) => (w.id === id ? f(w) : w));
  switch (a.type) {
    case "open":
      return { wins: [...s.wins, { ...a.win, z: s.z + 1 }], z: s.z + 1 };
    case "close":
      return { ...s, wins: s.wins.filter((w) => w.id !== a.id) };
    case "focus": {
      const w = s.wins.find((x) => x.id === a.id);
      if (!w) return s;
      const top = topWindow(s.wins);
      if (top?.id === a.id && !w.minimized) return s;
      return { wins: map(a.id, (x) => ({ ...x, minimized: false, z: s.z + 1 })), z: s.z + 1 };
    }
    case "minimize":
      return { ...s, wins: map(a.id, (x) => ({ ...x, minimized: true })) };
    case "mode":
      return { wins: map(a.id, (x) => ({ ...x, mode: a.mode, minimized: false, z: s.z + 1 })), z: s.z + 1 };
    case "rect":
      return { ...s, wins: map(a.id, (x) => ({ ...x, ...a.rect, mode: "normal" })) };
    case "arg":
      return { ...s, wins: map(a.id, (x) => ({ ...x, arg: a.arg, title: a.title })) };
    case "minimizeAll":
      return { ...s, wins: s.wins.map((x) => ({ ...x, minimized: true })) };
    case "closeAll":
      return { ...s, wins: [] };
  }
}

const topWindow = (wins: Win[]) =>
  wins.filter((w) => !w.minimized).reduce<Win | undefined>((t, w) => (!t || w.z > t.z ? w : t), undefined);

/* ---- Target resolution ---- */
export interface Resolved {
  app: AppId;
  arg?: string;
}

/** A target is a filesystem node id ("projects", "project:shrinkr") or an app ("app:terminal"). */
export function resolveTarget(target: string, arg?: string): Resolved | null {
  const node = getNode(target);
  if (node?.kind === "folder") return { app: "files", arg: node.id };
  if (node?.open) return { app: node.open.app, arg: arg ?? node.open.arg };
  if (target.startsWith("app:") && target.slice(4) in APPS) return { app: target.slice(4) as AppId, arg };
  return null;
}

export function titleFor(app: AppId, arg?: string): string {
  if ((app === "files" || app === "reader") && arg) return getNode(arg)?.name ?? APPS[app].title;
  if (app === "pdf") return "Resume.pdf";
  return APPS[app].title;
}

export function pathFor(app: AppId, arg?: string): string | undefined {
  if (app === "files" || app === "reader") return arg ? NODE_PATHS[arg] : undefined;
  if (app === "pdf") return "resume";
  return NODE_PATHS[`app:${app}`];
}

/* ---- Context ---- */
export interface Toast {
  id: number;
  title: string;
  body?: string;
}

interface OSApi {
  wins: Win[];
  focusId: string | null;
  open: (target: string, opts?: { arg?: string; history?: boolean; source?: string }) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMax: (id: string) => void;
  tile: (id: string, side: "left" | "right") => void;
  commitRect: (id: string, rect: Rect) => void;
  setMode: (id: string, mode: WinMode) => void;
  setArg: (id: string, arg: string | undefined) => void;
  minimizeAll: () => void;
  bringAllToFront: () => void;
  cycle: () => void;
  isOpen: (target: string) => boolean;
  /* UI surfaces */
  launcherOpen: boolean;
  setLauncherOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  centerOpen: boolean;
  setCenterOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  toasts: Toast[];
  toast: (title: string, body?: string) => void;
  dismissToast: (id: number) => void;
  menu: { x: number; y: number; items: MenuItem[] } | null;
  openMenu: (x: number, y: number, items: MenuItem[]) => void;
  closeMenu: () => void;
  snapPreview: Rect | null;
  setSnapPreview: (r: Rect | null) => void;
  /** Files windows register their view mode so View ▸ as List/as Icons can drive them. */
  filesView: Record<string, "grid" | "list">;
  setFilesView: (id: string, v: "grid" | "list") => void;
}

const Ctx = createContext<OSApi | null>(null);

let seq = 0;
const DEFAULT_TITLE = "Ishaan Ratanshi · Backend, Cloud & Applied AI Engineering";
/** What had focus when each window opened, so closing it can hand focus back. */
const openers = new Map<string, Element | null>();

/** After a window closes or minimizes: if nothing else is in front, return focus to its opener (or the desktop). */
function restoreFocus(id: string, remaining: Win[]) {
  const opener = openers.get(id);
  window.setTimeout(() => {
    if (remaining.some((w) => !w.minimized)) return; // the next window in front takes focus itself
    const fallback = document.querySelector<HTMLElement>(".desk-icon, .m-app");
    const target = opener instanceof HTMLElement && opener.isConnected && !opener.closest(".win") ? opener : fallback;
    target?.focus({ preventScroll: true });
  }, 30);
}

export function OSProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(reducer, { wins: [], z: 10 });
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [menu, setMenu] = useState<OSApi["menu"]>(null);
  const [snapPreview, setSnapPreview] = useState<Rect | null>(null);
  const [filesView, setFilesViewState] = useState<Record<string, "grid" | "list">>({});
  const winsRef = useRef(state.wins);
  winsRef.current = state.wins;
  const soundRef = useRef(settings.sound);
  soundRef.current = settings.sound;

  const focusWin = topWindow(state.wins);
  const focusId = focusWin?.id ?? null;

  const toast = useCallback((title: string, body?: string) => {
    const id = ++seq;
    setToasts((t) => [...t.slice(-2), { id, title, body }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const open = useCallback<OSApi["open"]>((target, opts = {}) => {
    const r = resolveTarget(target, opts.arg);
    if (!r) return;
    const def = APPS[r.app];
    const wins = winsRef.current;
    const existing = def.single
      ? wins.find((w) => w.app === r.app)
      : wins.find((w) => w.app === r.app && w.arg === r.arg);

    if (existing) {
      if (def.single && r.arg !== undefined && r.arg !== existing.arg)
        dispatch({ type: "arg", id: existing.id, arg: r.arg, title: titleFor(r.app, r.arg) });
      dispatch({ type: "focus", id: existing.id });
    } else {
      const d = desktopRect();
      // Never open bigger than ~80% of the desktop, so the desktop stays visible around a new window.
      const min = def.minSize ?? { w: 360, h: 240 };
      let w = Math.round(Math.max(Math.min(min.w, d.w - 24), Math.min(def.size.w, d.w * 0.8)));
      const h = Math.round(Math.max(Math.min(min.h, d.h - 16), Math.min(def.size.h, d.h * 0.86)));
      // Keep clear of the welcome card on the right when there's room; otherwise just center.
      const card = document.querySelector(".widget")?.getBoundingClientRect();
      // Beside the card, a window may shrink to the space available if that keeps at least ~85% of its size.
      const beside = card && card.width > 0 ? card.left - 16 - 130 : 0;
      const fitsBesideCard = beside >= Math.max(min.w, w * 0.85);
      if (fitsBesideCard) w = Math.min(w, beside);
      const right = fitsBesideCard ? card!.left - 16 : d.w;
      const left = right < d.w ? 130 : 0;
      const n = wins.filter((x) => !x.minimized).length % 6;
      const x = Math.max(12, Math.min(right - w - 8, Math.round(left + (right - left - w) / 2 + n * 26)));
      const y = Math.max(d.y + 8, Math.min(d.y + d.h - h - 6, Math.round(d.y + (d.h - h) / 2 - 20 + n * 24)));
      const id = `w${++seq}`;
      openers.set(id, document.activeElement);
      dispatch({
        type: "open",
        win: { id, app: r.app, arg: r.arg, title: titleFor(r.app, r.arg), x, y, w, h, mode: "normal", minimized: false, z: 0 },
      });
      playCue("open", soundRef.current);
      track("app_open", { app: r.app });
      if (r.app === "reader" && r.arg?.startsWith("project:")) track("project_view", { project: r.arg.slice(8) });
      if (r.app === "pdf") track("resume_download", { source: opts.source ?? "open" });
    }

    const path = pathFor(r.app, r.arg);
    if (path !== undefined && opts.history !== false) {
      const url = BASE + path;
      if (window.location.pathname !== url) {
        window.history.pushState({ target }, "", url);
        trackPageview(url, titleFor(r.app, r.arg));
      }
    }
  }, []);

  const close = useCallback((id: string) => {
    dispatch({ type: "close", id });
    playCue("close", soundRef.current);
    restoreFocus(id, winsRef.current.filter((w) => w.id !== id));
    openers.delete(id);
  }, []);
  const focus = useCallback((id: string) => dispatch({ type: "focus", id }), []);
  const minimize = useCallback((id: string) => {
    dispatch({ type: "minimize", id });
    restoreFocus(id, winsRef.current.filter((w) => w.id !== id));
  }, []);
  const setMode = useCallback((id: string, mode: WinMode) => dispatch({ type: "mode", id, mode }), []);
  const toggleMax = useCallback((id: string) => {
    const w = winsRef.current.find((x) => x.id === id);
    if (w) dispatch({ type: "mode", id, mode: w.mode === "max" ? "normal" : "max" });
  }, []);
  const tile = useCallback((id: string, side: "left" | "right") => dispatch({ type: "mode", id, mode: side }), []);
  const commitRect = useCallback((id: string, rect: Rect) => dispatch({ type: "rect", id, rect }), []);
  const setArg = useCallback((id: string, arg: string | undefined) => {
    const w = winsRef.current.find((x) => x.id === id);
    if (!w) return;
    dispatch({ type: "arg", id, arg, title: titleFor(w.app, arg) });
    const path = pathFor(w.app, arg);
    if (path !== undefined) window.history.replaceState({}, "", BASE + path);
  }, []);
  const minimizeAll = useCallback(() => dispatch({ type: "minimizeAll" }), []);
  const bringAllToFront = useCallback(() => {
    [...winsRef.current].sort((a, b) => a.z - b.z).forEach((w) => dispatch({ type: "focus", id: w.id }));
  }, []);
  const cycle = useCallback(() => {
    const sorted = [...winsRef.current].sort((a, b) => a.z - b.z);
    if (sorted.length > 1) dispatch({ type: "focus", id: sorted[0].id });
  }, []);
  const isOpen = useCallback(
    (target: string) => {
      const r = resolveTarget(target);
      if (!r) return false;
      return state.wins.some((w) => w.app === r.app && (APPS[r.app].single || r.app !== "files" || w.arg === r.arg));
    },
    [state.wins],
  );
  const openMenu = useCallback((x: number, y: number, items: MenuItem[]) => setMenu({ x, y, items }), []);
  const closeMenu = useCallback(() => setMenu(null), []);
  const setFilesView = useCallback(
    (id: string, v: "grid" | "list") => setFilesViewState((m) => (m[id] === v ? m : { ...m, [id]: v })),
    [],
  );

  // The browser tab names whatever is in front.
  useEffect(() => {
    document.title = focusWin ? `${focusWin.title} · iratanshOS` : DEFAULT_TITLE;
  }, [focusWin?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the address bar on the focused window, so a copied URL reopens what you're looking at.
  useEffect(() => {
    const path = focusWin ? pathFor(focusWin.app, focusWin.arg) : "";
    const url = BASE + (path ?? "");
    if (path !== undefined && window.location.pathname !== url) window.history.replaceState({}, "", url);
  }, [focusWin?.id, focusWin?.arg, focusWin?.app]); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back/forward reopens whatever that URL points at.
  useEffect(() => {
    const onPop = () => {
      const id = pathToNode(window.location.pathname.slice(BASE.length));
      if (id) open(id, { history: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  const value = useMemo<OSApi>(
    () => ({
      wins: state.wins,
      focusId,
      open,
      close,
      focus,
      minimize,
      toggleMax,
      tile,
      commitRect,
      setMode,
      setArg,
      minimizeAll,
      bringAllToFront,
      cycle,
      isOpen,
      launcherOpen,
      setLauncherOpen,
      centerOpen,
      setCenterOpen,
      toasts,
      toast,
      dismissToast,
      menu,
      openMenu,
      closeMenu,
      snapPreview,
      setSnapPreview,
      filesView,
      setFilesView,
    }),
    [state.wins, focusId, open, close, focus, minimize, toggleMax, tile, commitRect, setMode, setArg, minimizeAll, bringAllToFront, cycle, isOpen, launcherOpen, centerOpen, toasts, toast, dismissToast, menu, openMenu, closeMenu, snapPreview, filesView, setFilesView],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOS() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOS outside OSProvider");
  return c;
}

/** The node a deep link (current URL) points at, if any. */
export function initialTarget(): string | undefined {
  return pathToNode(window.location.pathname.slice(BASE.length));
}
