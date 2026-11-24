/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
export type WallpaperId = "lattice" | "dusk" | "contour" | "plain";
export type MotionPref = "system" | "reduced" | "full";

export interface Settings {
  theme: Theme;
  wallpaper: WallpaperId;
  motion: MotionPref;
  showIcons: boolean;
  sound: boolean;
}

export const WALLPAPERS: { id: WallpaperId; name: string; description: string }[] = [
  { id: "lattice", name: "Lattice", description: "A quiet network of nodes and links." },
  { id: "dusk", name: "Dusk", description: "Emerald and cyan light over charcoal." },
  { id: "contour", name: "Contour", description: "Topographic lines, like a load profile." },
  { id: "plain", name: "Graphite", description: "Solid and distraction-free." },
];

const DEFAULTS: Settings = { theme: "dark", wallpaper: "lattice", motion: "system", showIcons: true, sound: false };
const KEY = "iratanshos.settings";

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    /* storage unavailable */
  }
  return DEFAULTS;
}

interface SettingsCtx {
  settings: Settings;
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  reducedMotion: boolean;
  overdrive: boolean;
  setOverdrive: (on: boolean) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

function useSystemReducedMotion() {
  const q = "(prefers-reduced-motion: reduce)";
  const [v, setV] = useState(() => window.matchMedia?.(q).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = () => setV(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return v;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  const [overdrive, setOverdrive] = useState(false);
  const systemReduced = useSystemReducedMotion();
  const reducedMotion = settings.motion === "reduced" || (settings.motion === "system" && systemReduced);

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    setSettings((s) => {
      const next = { ...s, [k]: v };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.overdrive = overdrive ? "on" : "off";
    root.dataset.motion = reducedMotion ? "reduced" : "full";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", settings.theme === "dark" ? "#07090b" : "#e9eeec");
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", settings.theme);
  }, [settings.theme, overdrive, reducedMotion]);

  const value = useMemo(
    () => ({ settings, set, reducedMotion, overdrive, setOverdrive }),
    [settings, set, reducedMotion, overdrive],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSettings outside SettingsProvider");
  return c;
}

/* ---- Sound ----
 * Tiny synthesized cues (no audio files). Off by default; Settings › Sound turns them on. */
let audio: AudioContext | null = null;
const CUES = {
  open: [660, 880],
  close: [520, 390],
  click: [1200],
  error: [220, 180],
} as const;

export function playCue(kind: keyof typeof CUES, enabled: boolean) {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    const t0 = audio.currentTime;
    CUES[kind].forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = t0 + i * 0.05;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(audio!.destination);
      o.start(t);
      o.stop(t + 0.14);
    });
  } catch {
    /* audio unavailable */
  }
}
