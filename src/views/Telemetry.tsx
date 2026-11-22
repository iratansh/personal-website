/**
 * Site Telemetry — analytics status console. DEV ONLY (compiled out of production by App.tsx).
 *
 * It deliberately shows no traffic numbers: Cloudflare Web Analytics has no documented API for
 * the beacon's data, and this static site holds no API credentials. Traffic lives in the
 * Cloudflare dashboard; this view shows configuration, capabilities, and real local signals.
 */
import { useMemo, useSyncExternalStore } from "react";
import { analyticsConfig, configuredProviders, PROVIDER_CAPABILITIES, type ProviderId } from "../analytics/config";
import { consentState, sessionLog, subscribe } from "../analytics";
import { EVENTS } from "../analytics/events";
import { sessionVitals } from "../analytics/vitals";
import { useNow } from "../lib/hooks";
import { Icon } from "../components/ui/Icon";
import { SectionHead, ViewHeader } from "../components/ui/Primitives";

const VITALS = [
  { key: "lcp", label: "LCP", unit: "ms", good: 2500, poor: 4000 },
  { key: "inp", label: "INP", unit: "ms", good: 200, poor: 500 },
  { key: "cls", label: "CLS", unit: "", good: 0.1, poor: 0.25 },
  { key: "fcp", label: "FCP", unit: "ms", good: 1800, poor: 3000 },
  { key: "ttfb", label: "TTFB", unit: "ms", good: 800, poor: 1800 },
] as const;

function rating(v: number, good: number, poor: number) {
  return v <= good
    ? { cls: "good", text: "good", icon: "●" }
    : v <= poor
      ? { cls: "warn", text: "needs work", icon: "▲" }
      : { cls: "poor", text: "poor", icon: "■" };
}

/** Metrics the Cloudflare Web Analytics dashboard reports for this site. */
const CF_METRICS = [
  ["Visits & page views", "over time, per page path"],
  ["Popular pages", "incl. /registry/<project> — every project has a real URL"],
  ["Referrers", "traffic sources (query strings such as UTM tags are not logged)"],
  ["Countries", "derived from IP at request time"],
  ["Browsers, OS, device type", "from the user agent"],
  ["Core Web Vitals", "LCP, INP, CLS — field data from real visitors"],
] as const;

export default function Telemetry() {
  useSyncExternalStore(subscribe, () => {
    const l = sessionLog();
    return `${l.length}:${l[l.length - 1]?.id ?? 0}`;
  });
  useNow(2000);
  const log = sessionLog();
  const configured = configuredProviders();
  const sv = sessionVitals();
  const eventsEnabled = configured.some((p) => PROVIDER_CAPABILITIES[p].customEvents);

  const eventCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of log) if (e.kind === "event") m.set(e.name, (m.get(e.name) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [log, log.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="view telemetry">
      <ViewHeader
        index="07"
        kicker="Site Telemetry · local only"
        title={
          <>
            The site, <span className="serif accent-2">observing itself</span>.
          </>
        }
        lede="Analytics status for this website. This module exists only in local development builds. It shows no traffic numbers — those live in the Cloudflare dashboard — just configuration and real signals from this tab."
      />

      <div className="tm-grid">
        <section className="tm-panel tm-wide frame">
          <SectionHead
            index="A"
            title="Basic traffic · Cloudflare Web Analytics"
            aside={
              <span className={`tm-badge ${configured.includes("cloudflare") ? "tm-badge-live" : "tm-badge-off"}`}>
                {configured.includes("cloudflare") ? "beacon configured" : "not configured"}
              </span>
            }
          />
          <div className="tm-cf">
            <div>
              <ul className="tm-metrics">
                {CF_METRICS.map(([m, d]) => (
                  <li key={m}>
                    <span className="accent">✓</span>
                    <strong>{m}</strong>
                    <span className="dim">{d}</span>
                  </li>
                ))}
              </ul>
              <a className="btn" href={PROVIDER_CAPABILITIES.cloudflare.dashboard} target="_blank" rel="noreferrer">
                Open Cloudflare dashboard <Icon name="arrowUpRight" />
              </a>
            </div>
            <dl className="tm-facts">
              <div>
                <dt className="label">Token</dt>
                <dd className="mono">{analyticsConfig.cloudflare.token.slice(0, 6)}… (public, in config.ts)</dd>
              </div>
              <div>
                <dt className="label">Loads</dt>
                <dd>Production builds only, after the page is idle, unless DNT / GPC / opt-out.</dd>
              </div>
              <div>
                <dt className="label">SPA routing</dt>
                <dd>Beacon follows pushState navigation (on by default).</dd>
              </div>
              <div>
                <dt className="label">In-site charts</dt>
                <dd>
                  Not built. Cloudflare has no documented API for this data; the GraphQL dataset is undocumented and
                  would need a server-side token. See ANALYTICS.md.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="tm-panel tm-wide frame">
          <SectionHead index="B" title="Provider capabilities" />
          <div className="tm-support">
            <table className="chart-table mono">
              <thead>
                <tr>
                  <th>Capability</th>
                  {(Object.keys(PROVIDER_CAPABILITIES) as ProviderId[]).map((p) => (
                    <th key={p}>
                      {PROVIDER_CAPABILITIES[p].name}
                      <span className="dim"> · {configured.includes(p) ? "on" : "off"}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Page views & visitors", "pageviews"],
                    ["Custom events", "customEvents"],
                    ["Web Vitals", "webVitals"],
                  ] as const
                ).map(([label, k]) => (
                  <tr key={k}>
                    <td>{label}</td>
                    {(Object.keys(PROVIDER_CAPABILITIES) as ProviderId[]).map((p) => (
                      <td key={p}>{PROVIDER_CAPABILITIES[p][k] ? "✓ yes" : "✕ no"}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>Read API</td>
                  {(Object.keys(PROVIDER_CAPABILITIES) as ProviderId[]).map((p) => (
                    <td key={p}>{PROVIDER_CAPABILITIES[p].readApi}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="tm-panel tm-wide frame">
          <SectionHead
            index="C"
            title="Custom interaction events"
            aside={<span className="label tm-real">real · this tab only</span>}
          />
          <p className="tm-foot">
            {eventsEnabled
              ? "GoatCounter is configured: in production these events are sent there. View totals in your GoatCounter dashboard."
              : "No event provider is configured, so in production these events go nowhere. Cloudflare cannot record them. Set VITE_GOATCOUNTER_ENDPOINT to enable (see ANALYTICS.md)."}
          </p>
          <div className="tm-events">
            <div>
              <h3 className="label">Fired in this tab ({log.filter((e) => e.kind === "event").length})</h3>
              {eventCounts.length ? (
                <ul className="tm-ev-counts mono">
                  {eventCounts.map(([name, n]) => (
                    <li key={name}>
                      <span>{name}</span>
                      <span className="dim">{EVENTS[name as keyof typeof EVENTS]?.label}</span>
                      <strong>{n}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="bars-empty mono">Use the terminal, palette, or links; events appear here.</p>
              )}
            </div>
            <div>
              <h3 className="label">Stream</h3>
              <ol className="tm-stream mono" aria-live="polite">
                {[...log]
                  .reverse()
                  .slice(0, 14)
                  .map((e) => (
                    <li key={e.id}>
                      <span className="dim">{new Date(e.at).toLocaleTimeString()}</span>
                      <span className={e.kind === "pageview" ? "accent-2" : "accent"}>{e.kind === "pageview" ? "view" : "event"}</span>
                      <span className="tm-stream-name">
                        {e.name}
                        {e.props && Object.keys(e.props).length > 0 && (
                          <span className="dim"> {Object.entries(e.props).map(([k, v]) => `${k}=${v}`).join(" ")}</span>
                        )}
                      </span>
                      <span className="dim">→ {e.deliveredTo.join(", ") || "local only"}</span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
          <p className="tm-foot dim">
            Providers {analyticsConfig.active ? "are active in this build" : "never load in dev builds"} · consent:{" "}
            {consentState()} · this log is in memory only.
          </p>
        </section>

        <section className="tm-panel tm-wide frame">
          <SectionHead index="D" title="Performance · this tab" aside={<span className="label tm-real">real · measured locally</span>} />
          <div className="vitals">
            {VITALS.map((v) => {
              const value = sv[v.key as keyof typeof sv];
              const r = value === undefined ? null : rating(value, v.good, v.poor);
              return (
                <div key={v.key} className="vital">
                  <span className="label">{v.label}</span>
                  <span className="vital-value mono">
                    {value === undefined ? "—" : v.unit ? Math.round(value) : value.toFixed(3)}
                    {value !== undefined && v.unit && <small> {v.unit}</small>}
                  </span>
                  {r ? (
                    <span className={`vital-rating ${r.cls} label`}>
                      <span aria-hidden="true">{r.icon}</span> {r.text}
                    </span>
                  ) : (
                    <span className="vital-rating label dim">no sample</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="tm-foot dim">
            PerformanceObserver in this tab, on the dev server — not representative of production. Field data from real
            visitors is in the Cloudflare dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
