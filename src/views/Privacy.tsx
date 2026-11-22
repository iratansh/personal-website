import { useEffect, useState } from "react";
import { analyticsConfig, configuredProviders, PROVIDER_CAPABILITIES } from "../analytics/config";
import { activeProviders, consentState, setOptOut, subscribe, type ConsentState } from "../analytics";
import { EVENTS } from "../analytics/events";
import { profile } from "../data/profile";
import { Icon } from "../components/ui/Icon";
import { SectionHead, ViewHeader } from "../components/ui/Primitives";

const CONSENT_COPY: Record<ConsentState, string> = {
  allowed: "Analytics are allowed in this browser.",
  dnt: "Your browser sends Do Not Track, so no analytics scripts are loaded.",
  gpc: "Your browser sends Global Privacy Control, so no analytics scripts are loaded.",
  "opted-out": "You've opted out in this browser. No analytics scripts are loaded.",
};

export default function Privacy() {
  const [consent, setConsent] = useState(consentState);
  useEffect(() => subscribe(() => setConsent(consentState())), []);
  const configured = configuredProviders();
  const running = activeProviders();
  const hasEvents = configured.some((p) => PROVIDER_CAPABILITIES[p].customEvents);
  const loadedThisSession = running.length > 0;

  return (
    <div className="view privacy">
      <ViewHeader
        index="—"
        kicker="Privacy"
        title="What this site measures."
        lede="Plain-language disclosure of the analytics on this site. No advertising, no cross-site tracking, and nothing that identifies you personally."
      />

      <section className="pv-status frame">
        <div>
          <span className="label">Your status</span>
          <p className="pv-status-line">
            <span className={`dot ${consent === "allowed" ? "" : "pv-dot-off"}`} /> {CONSENT_COPY[consent]}
          </p>
          {!analyticsConfig.active && <p className="dim pv-note">This build has analytics disabled entirely.</p>}
          {analyticsConfig.active && configured.length === 0 && (
            <p className="dim pv-note">No analytics provider is configured in this build, so nothing is collected.</p>
          )}
        </div>
        {consent === "allowed" || consent === "opted-out" ? (
          <div className="pv-actions">
            {consent === "allowed" ? (
              <button className="btn" onClick={() => setOptOut(true)}>
                Opt out in this browser
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={() => setOptOut(false)}>
                Opt back in
              </button>
            )}
            {consent === "opted-out" && loadedThisSession && (
              <button className="btn btn-ghost" onClick={() => window.location.reload()}>
                <Icon name="reset" /> Reload to unload scripts
              </button>
            )}
          </div>
        ) : null}
      </section>

      <section className="pv-sec">
        <SectionHead index="01" title="Providers" />
        {configured.length === 0 ? (
          <p className="pv-p">None configured in this build.</p>
        ) : (
          <ul className="pv-providers">
            {configured.map((id) => {
              const c = PROVIDER_CAPABILITIES[id];
              return (
                <li key={id}>
                  <strong>{c.name}</strong>
                  <span className="dim">
                    {c.cookies === false ? "no cookies" : c.cookies ? "uses cookies" : "see provider docs"} · pageviews{c.customEvents ? " · interaction events" : ""}
                    {c.webVitals ? " · performance timings" : ""}
                  </span>
                  <a className="link-arrow" href={c.docs} target="_blank" rel="noreferrer">
                    documentation <Icon name="arrowUpRight" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="pv-sec">
        <SectionHead index="02" title="What is collected" />
        <ul className="pv-list">
          <li>The page you viewed (path only — query strings and fragments are dropped) and the referring site.</li>
          <li>Browser, operating system, and device type, derived from the user-agent string.</li>
          <li>Approximate country, derived by the provider from your IP address at request time.</li>
          {configured.includes("goatcounter") && (
            <li>
              To count a visit once, GoatCounter combines your IP address and user agent into a session key held only in
              its server memory for up to 8 hours. GoatCounter says it never writes either to disk.
            </li>
          )}
          {configured.includes("cloudflare") && (
            <li>Page-load performance timings (Core Web Vitals) measured by Cloudflare&apos;s script.</li>
          )}
          {hasEvents && (
            <li>
              Anonymous interaction counts — e.g. “résumé opened”, “GitHub link clicked”, or the <em>name</em> of a terminal
              command. Terminal arguments, search queries, and anything you type into forms are never recorded.
            </li>
          )}
        </ul>
      </section>

      <section className="pv-sec">
        <SectionHead index="03" title="What is not collected" />
        <ul className="pv-list">
          {configured.length > 0 && configured.every((p) => PROVIDER_CAPABILITIES[p].cookies === false) && (
            <li>No cookies or tracking identifiers are stored in your browser by the analytics scripts.</li>
          )}
          <li>No names, email addresses, or message contents. The contact form only opens your own mail client.</li>
          <li>No data is sold, shared with advertisers, or used to follow you across other websites.</li>
        </ul>
      </section>

      <section className="pv-sec">
        <SectionHead index="04" title="Local storage on your device" />
        <p className="pv-p">
          The site itself stores two small preferences in your browser — your motion setting and, if you choose it, your
          analytics opt-out — plus a session flag so the boot animation only plays once. These never leave your device.
        </p>
      </section>

      {hasEvents && (
        <section className="pv-sec">
          <SectionHead index="05" title="Interaction events" />
          <ul className="pv-events mono">
            {Object.entries(EVENTS).map(([k, v]) => (
              <li key={k}>
                <span className="accent">{k}</span>
                <span className="dim">{v.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="pv-p pv-contact">
        Questions? <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
    </div>
  );
}
