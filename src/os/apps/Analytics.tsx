import { useEffect, useState } from "react";
import { ExternalLink, Lock } from "lucide-react";
import { analyticsConfig, configuredProviders, PROVIDER_CAPABILITIES } from "../../analytics/config";
import { EVENTS } from "../../analytics/events";
import { sessionLog, subscribe, type LoggedEvent } from "../../analytics";
import { useOS } from "../store";

/**
 * Visitor analytics are private. This static site holds no API credentials, so it can't (and
 * shouldn't) show traffic numbers. The owner reads them in each provider's dashboard after
 * signing in. What this app CAN show honestly is what gets measured, and what this tab has recorded.
 */
export default function Analytics() {
  const os = useOS();
  const [log, setLog] = useState<readonly LoggedEvent[]>(() => [...sessionLog()]);
  useEffect(() => subscribe(() => setLog([...sessionLog()])), []);
  const providers = configuredProviders();
  const gcDash = (() => {
    try {
      return new URL(analyticsConfig.goatcounter.endpoint).origin;
    } catch {
      return PROVIDER_CAPABILITIES.goatcounter.dashboard;
    }
  })();

  return (
    <div className="analytics">
      <header className="an-gate">
        <span className="an-lock">
          <Lock size={20} />
        </span>
        <div>
          <h2>Analytics is private</h2>
          <p>
            Visitor numbers aren&rsquo;t published here. They live in the owner&rsquo;s analytics dashboards, which need a login.
            This site ships no analytics credentials, so there is nothing private to leak from this page.
          </p>
        </div>
      </header>

      <section className="an-sec">
        <h3>Owner dashboards</h3>
        <div className="an-dash">
          {providers.includes("cloudflare") && (
            <a className="an-card" href={PROVIDER_CAPABILITIES.cloudflare.dashboard} target="_blank" rel="noreferrer">
              <strong>Cloudflare Web Analytics</strong>
              <span>Visitors, page views, countries, devices, browsers, referrers, and Core Web Vitals.</span>
              <em>
                Sign in required <ExternalLink size={12} />
              </em>
            </a>
          )}
          {providers.includes("goatcounter") && (
            <a className="an-card" href={gcDash} target="_blank" rel="noreferrer">
              <strong>GoatCounter</strong>
              <span>Interaction events: résumé opens, app usage, GitHub clicks, terminal commands, contact actions.</span>
              <em>
                Sign in required <ExternalLink size={12} />
              </em>
            </a>
          )}
        </div>
      </section>

      <section className="an-sec">
        <h3>What is measured</h3>
        <p className="an-p">
          {Object.keys(EVENTS).length} kinds of anonymous interaction event, plus page views. Opening a window counts as a page view
          for that project or document. No cookies, no names, no typed text.{" "}
          <button className="doc-inlink" onClick={() => os.open("privacy")}>
            Full disclosure in Privacy.md →
          </button>
        </p>
      </section>

      <section className="an-sec">
        <h3>
          This tab, right now <span className="real-badge">real · local only</span>
        </h3>
        <p className="an-p">
          Everything this browser tab has recorded since you opened iratanshOS. It&rsquo;s kept in memory and disappears when you
          close the tab.{" "}
          {!analyticsConfig.active && "This is a development build, so nothing is sent anywhere."}
        </p>
        {log.length === 0 ? (
          <p className="an-empty">Nothing yet. Open something and watch it appear here.</p>
        ) : (
          <ol className="an-log">
            {[...log].reverse().slice(0, 40).map((e) => (
              <li key={e.id}>
                <time>{new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
                <span className={`an-kind an-${e.kind}`}>{e.kind}</span>
                <span className="an-name">{e.name}</span>
                <span className="an-props">
                  {e.props &&
                    Object.entries(e.props)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" ")}
                </span>
                <span className="an-to">{e.deliveredTo.length ? `→ ${e.deliveredTo.join(", ")}` : "not sent"}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
