import { useEffect, useState } from "react";

/** Viewport size, updated at most once per frame. */
export function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setV({ w: window.innerWidth, h: window.innerHeight }));
    };
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", on);
    };
  }, []);
  return v;
}

/**
 * Phones, and any touch-only device (tablets included: no hover, coarse pointer), get the
 * single-window touch shell. Floating windows need a mouse or trackpad to feel right.
 */
const MOBILE_Q = "(max-width: 760px), (pointer: coarse) and (hover: none), (max-height: 520px) and (pointer: coarse)";

export function useIsMobile() {
  const [m, setM] = useState(() => window.matchMedia(MOBILE_Q).matches);
  useEffect(() => {
    const q = window.matchMedia(MOBILE_Q);
    const on = () => setM(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return m;
}

export const isTypingTarget = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
export const MOD = isMac ? "⌘" : "Ctrl";

/** Formats YYYY-MM or YYYY-MM-DD as "Nov 2026" / "Nov 14, 2026". */
export function formatDate(d?: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, day || 1));
  return dt.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    ...(day ? { day: "numeric" } : {}),
    timeZone: "UTC",
  });
}
