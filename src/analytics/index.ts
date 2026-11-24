import { analyticsConfig, configuredProviders, type ProviderId } from "./config";
import { EVENTS, type EventName, type EventProps } from "./events";
import { cloudflareProvider, goatcounterProvider, type Provider } from "./providers";

/**
 * Provider-agnostic analytics facade.
 *  - Honors Do Not Track, Global Privacy Control, and an on-site opt-out.
 *  - Loads third-party scripts lazily, after the page is idle.
 *  - Keeps an in-memory log of this session's events (never persisted) for the Analytics app.
 */

export interface LoggedEvent {
  id: number;
  at: number;
  kind: "event" | "pageview";
  name: string;
  props?: EventProps;
  /** Providers that actually received it (empty = recorded nowhere). */
  deliveredTo: ProviderId[];
}

const OPT_OUT_KEY = "nexus.analytics.optout";
const providers: Provider[] = [];
const log: LoggedEvent[] = [];
const listeners = new Set<() => void>();
let started = false;
let seq = 0;

export type ConsentState = "allowed" | "dnt" | "gpc" | "opted-out";

export function consentState(): ConsentState {
  try {
    if (localStorage.getItem(OPT_OUT_KEY) === "1") return "opted-out";
  } catch {
    /* storage blocked */
  }
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl) return "gpc";
  if (nav.doNotTrack === "1" || (window as unknown as { doNotTrack?: string }).doNotTrack === "1") return "dnt";
  return "allowed";
}

export function setOptOut(optOut: boolean) {
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

/** Providers that are configured and will run for this visitor. */
export function activeProviders(): ProviderId[] {
  return providers.map((p) => p.id);
}

function notify() {
  listeners.forEach((l) => l());
}

function record(entry: Omit<LoggedEvent, "id" | "at">) {
  const e = { ...entry, id: ++seq, at: Date.now() };
  log.push(e);
  if (log.length > 200) log.shift();
  if (analyticsConfig.debug) {
    console.debug(`%c[analytics] ${e.kind}`, "color:#34e0a1", e.name, e.props ?? "", "→", e.deliveredTo.join(", ") || "(none)");
  }
  notify();
}

export function sessionLog(): readonly LoggedEvent[] {
  return log;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Called once at startup. Script loading is deferred until the browser is idle. */
export function initAnalytics() {
  if (started) return;
  started = true;
  if (!analyticsConfig.active || consentState() !== "allowed") return;

  const ids = configuredProviders();
  if (ids.includes("cloudflare")) providers.push(cloudflareProvider(analyticsConfig.cloudflare.token));
  if (ids.includes("goatcounter")) providers.push(goatcounterProvider(analyticsConfig.goatcounter.endpoint));
  if (!providers.length) return;

  const load = () => providers.forEach((p) => p.load());
  const ric = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const whenIdle = () => (ric ? ric(load, { timeout: 2000 }) : window.setTimeout(load, 1500));
  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}

const allowed = () => analyticsConfig.active && consentState() === "allowed";

/** Virtual pageview for client-side navigation. */
export function trackPageview(path: string, title?: string) {
  const delivered: ProviderId[] = [];
  if (allowed()) {
    for (const p of providers) if (p.pageview(path, title)) delivered.push(p.id);
  }
  record({ kind: "pageview", name: path, deliveredTo: delivered });
}

export function track(name: EventName, props?: EventProps) {
  if (!(name in EVENTS)) return;
  const clean: EventProps = {};
  for (const [k, v] of Object.entries(props ?? {})) if (v) clean[k] = String(v).slice(0, 60);
  const delivered: ProviderId[] = [];
  if (allowed()) {
    for (const p of providers) if (p.event(name, clean)) delivered.push(p.id);
  }
  record({ kind: "event", name, props: clean, deliveredTo: delivered });
}

/**
 * Delegated click tracking for links, so individual anchors need no wiring.
 * Source is taken from the nearest [data-track-source] or falls back to the current module.
 */
let linkTrackingInstalled = false;
export function installLinkTracking(currentModule: () => string) {
  if (linkTrackingInstalled) return;
  linkTrackingInstalled = true;
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a || !a.href) return;
    const source = a.closest<HTMLElement>("[data-track-source]")?.dataset.trackSource ?? currentModule();
    let url: URL;
    try {
      url = new URL(a.href, window.location.href);
    } catch {
      return;
    }
    if (url.protocol === "mailto:") return track("contact_mailto", { source });
    if (/\.pdf$/i.test(url.pathname) && url.origin === window.location.origin) return track("resume_download", { source });
    if (url.origin === window.location.origin) return;
    if (url.hostname === "github.com") {
      const target = url.pathname.split("/").filter(Boolean).slice(0, 2).join("/") || "profile";
      return track("outbound_github", { target, source });
    }
    if (url.hostname.endsWith("linkedin.com")) return track("outbound_linkedin", { source });
    return track("outbound_link", { host: url.hostname, source });
  };
  document.addEventListener("click", onClick, { capture: true });
  // Middle-click opens in a new tab without firing "click".
  document.addEventListener("auxclick", onClick, { capture: true });
}
