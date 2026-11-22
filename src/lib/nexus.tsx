import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BASE, moduleById, parseLegacyHash, parsePath, toAnalyticsPath, toHref, type Route } from "./routes";
import { initAnalytics, installLinkTracking, trackPageview, track } from "../analytics";
import { startVitals } from "../analytics/vitals";

interface Toast {
  id: number;
  text: string;
  tone?: "ok" | "warn" | "violet";
}

interface NexusState {
  route: Route;
  navigate: (route: Route | string) => void;
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean | ((o: boolean) => boolean)) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean | ((o: boolean) => boolean)) => void;
  /** True when motion should be minimised (OS preference or user toggle). */
  reducedMotion: boolean;
  motionPref: "system" | "on" | "off";
  cycleMotion: () => void;
  overdrive: boolean;
  setOverdrive: (on: boolean) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  session: { startedAt: number; commands: number; routes: Set<string> };
  bumpCommands: () => void;
}

const NexusContext = createContext<NexusState | null>(null);

function readMotionPref(): "system" | "on" | "off" {
  try {
    const v = localStorage.getItem("nexus.motion");
    if (v === "on" || v === "off") return v;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

export function NexusProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => {
    // Upgrade links from the old hash-routed site (#/registry/x → /registry/x).
    const legacy = parseLegacyHash(window.location.hash);
    if (legacy) {
      window.history.replaceState(null, "", toHref(legacy));
      return legacy;
    }
    return parsePath(window.location.pathname);
  });
  const routeRef = useRef(route);
  routeRef.current = route;
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [overdrive, setOverdrive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [motionPref, setMotionPref] = useState(readMotionPref);
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const [, force] = useState(0);
  const session = useRef({ startedAt: Date.now(), commands: 0, routes: new Set<string>() });

  const navigate = useCallback((r: Route | string) => {
    const href = typeof r === "string" ? r : toHref(r);
    if (window.location.pathname === href && !window.location.hash) return;
    window.history.pushState(null, "", href);
    setRoute(parsePath(new URL(href, window.location.origin).pathname));
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener("popstate", onPop);

    // Client-side navigation for same-site links (keeps <a href> semantics for crawlers & new tabs).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !(url.pathname + "/").startsWith(BASE)) return;
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return; // static assets such as the résumé
      if (url.hash && url.pathname === window.location.pathname) return; // in-page anchors
      e.preventDefault();
      navigate(url.pathname);
    };
    document.addEventListener("click", onClick);

    initAnalytics();
    startVitals();
    installLinkTracking(() => routeRef.current.module);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, [navigate]);

  useEffect(() => {
    session.current.routes.add(route.module);
    if (route.notFound) return;
    trackPageview(toAnalyticsPath(route), moduleById[route.module]?.label);
    if (route.module === "registry" && route.param) track("project_view", { project: route.param });
  }, [route]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const reducedMotion = motionPref === "off" || (motionPref === "system" && systemReduced);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.dataset.overdrive = overdrive ? "on" : "off";
  }, [overdrive]);


  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const cycleMotion = useCallback(() => {
    setMotionPref((p) => {
      const next = p === "system" ? (systemReduced ? "on" : "off") : p === "off" ? "on" : "off";
      try {
        localStorage.setItem("nexus.motion", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [systemReduced]);

  const bumpCommands = useCallback(() => {
    session.current.commands += 1;
    force((n) => n + 1);
  }, []);

  const value = useMemo<NexusState>(
    () => ({
      route,
      navigate,
      terminalOpen,
      setTerminalOpen,
      paletteOpen,
      setPaletteOpen,
      reducedMotion,
      motionPref,
      cycleMotion,
      overdrive,
      setOverdrive,
      toasts,
      toast,
      session: session.current,
      bumpCommands,
    }),
    [route, navigate, terminalOpen, paletteOpen, reducedMotion, motionPref, cycleMotion, overdrive, toasts, toast, bumpCommands],
  );

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNexus() {
  const ctx = useContext(NexusContext);
  if (!ctx) throw new Error("useNexus must be used inside <NexusProvider>");
  return ctx;
}
