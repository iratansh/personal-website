/**
 * Measures Core Web Vitals for *this* browser session using PerformanceObserver.
 * Nothing here is sent anywhere. It powers the "this session" panel in the dev dashboard.
 * (Cloudflare measures field vitals for real visitors on its own.)
 */
export interface SessionVitals {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
}

const vitals: SessionVitals = {};
let started = false;

function observe(type: string, cb: (entries: PerformanceEntryList) => void, opts: Record<string, unknown> = {}) {
  try {
    const po = new PerformanceObserver((list) => cb(list.getEntries()));
    po.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
  } catch {
    /* unsupported entry type in this browser */
  }
}

export function startVitals() {
  if (started || typeof PerformanceObserver === "undefined") return;
  started = true;

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav) vitals.ttfb = Math.round(nav.responseStart);

  observe("paint", (es) => {
    const fcp = es.find((e) => e.name === "first-contentful-paint");
    if (fcp) vitals.fcp = Math.round(fcp.startTime);
  });
  observe("largest-contentful-paint", (es) => {
    const last = es[es.length - 1];
    if (last) vitals.lcp = Math.round(last.startTime);
  });
  let cls = 0;
  observe("layout-shift", (es) => {
    for (const e of es as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
      if (!e.hadRecentInput) cls += e.value;
    }
    vitals.cls = Math.round(cls * 1000) / 1000;
  });
  // INP approximation: the slowest interaction seen so far.
  observe(
    "event",
    (es) => {
      for (const e of es as Array<PerformanceEntry & { interactionId?: number }>) {
        if (e.interactionId) vitals.inp = Math.max(vitals.inp ?? 0, Math.round(e.duration));
      }
    },
    { durationThreshold: 16 },
  );
}

export function sessionVitals(): Readonly<SessionVitals> {
  return vitals;
}
