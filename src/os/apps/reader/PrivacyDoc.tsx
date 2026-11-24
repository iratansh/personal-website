import { useEffect, useState } from "react";
import { analyticsConfig, configuredProviders, PROVIDER_CAPABILITIES } from "../../../analytics/config";
import { activeProviders, consentState, setOptOut, subscribe, type ConsentState } from "../../../analytics";
import { EVENTS } from "../../../analytics/events";
import { profile } from "../../../data/profile";
import { DocHeader, Ext, Section } from "./parts";

const CONSENT_COPY: Record<ConsentState, string> = {
  allowed: "Analytics are allowed in this browser.",
  dnt: "Your browser sends Do Not Track, so no analytics scripts are loaded.",
  gpc: "Your browser sends Global Privacy Control, so no analytics scripts are loaded.",
  "opted-out": "You've opted out in this browser. No analytics scripts are loaded.",
};

/** Opt-out controls, shared with Settings › Privacy. */
export function ConsentControls() {
  const [consent, setConsent] = useState(consentState);
  useEffect(() => subscribe(() => setConsent(consentState())), []);
  const loaded = activeProviders().length > 0;
  return (
    <div className="consent">
      <p className="consent-line">
        <span className={`dot${consent === "allowed" ? "" : " dot-off"}`} /> {CONSENT_COPY[consent]}
      </p>
      {!analyticsConfig.active && <p className="doc-note">This build has analytics disabled entirely (local development).</p>}
      <div className="consent-actions">
        {consent === "allowed" && (
          <button className="btn" onClick={() => setOptOut(true)}>
            Opt out in this browser
          </button>
        )}
        {consent === "opted-out" && (
          <button className="btn btn-ghost" onClick={() => setOptOut(false)}>
            Opt back in
          </button>
        )}
        {consent === "opted-out" && loaded && (
          <button className="btn btn-ghost" onClick={() => window.location.reload()}>
            Reload to unload scripts
          </button>
        )}
      </div>
    </div>
  );
}

export function PrivacyDoc() {
  const configured = configuredProviders();
  const hasEvents = configured.some((p) => PROVIDER_CAPABILITIES[p].customEvents);
  return (
    <article className="doc doc-txt">
      <DocHeader
        kicker="System / Privacy.md"
        title="What this site measures"
        dek="Plain-language disclosure of the analytics here. No advertising, no cross-site tracking, nothing that identifies you."
      />
      <Section id="status" title="Your status">
        <ConsentControls />
      </Section>
      <Section id="providers" title="Providers">
        <ul className="doc-bullets">
          {configured.map((id) => {
            const c = PROVIDER_CAPABILITIES[id];
            return (
              <li key={id}>
                <strong>{c.name}</strong>: {c.cookies === false ? "no cookies" : "see provider docs"}, pageviews
                {c.customEvents ? ", interaction events" : ""}
                {c.webVitals ? ", performance timings" : ""}. <Ext href={c.docs}>Documentation</Ext>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section id="collected" title="What is collected">
        <ul className="doc-bullets">
          <li>
            The page you viewed (path only; query strings and fragments are dropped) and the referring site. Opening a window
            changes the address bar, so each opened project or document counts as a page.
          </li>
          <li>Browser, operating system, and device type, derived from the user-agent string.</li>
          <li>Approximate country, derived by the provider from your IP address at request time.</li>
          {configured.includes("goatcounter") && (
            <li>
              To count a visit once, GoatCounter combines your IP address and user agent into a session key held only in its
              server memory for up to 8 hours. GoatCounter says it never writes either to disk.
            </li>
          )}
          {configured.includes("cloudflare") && <li>Page-load performance timings (Core Web Vitals) measured by Cloudflare&apos;s script.</li>}
          {hasEvents && (
            <li>
              Anonymous interaction counts, e.g. “résumé opened”, “app opened”, or the <em>name</em> of a terminal command.
              Terminal arguments, search queries, and anything you type into forms are never recorded.
            </li>
          )}
        </ul>
      </Section>
      <Section id="not" title="What is not collected">
        <ul className="doc-bullets">
          <li>No cookies or tracking identifiers are set by the analytics scripts.</li>
          <li>No names, email addresses, or message contents. The Contact app only opens your own mail client.</li>
          <li>No data is sold, shared with advertisers, or used to follow you across other websites.</li>
        </ul>
      </Section>
      <Section id="local" title="Stored on your device">
        <p className="doc-p">
          iratanshOS keeps a few things in your browser so it feels the same next time: your settings (appearance, wallpaper,
          motion, sound, icon visibility), where you dragged desktop icons, which notifications you dismissed, your analytics
          opt-out if you chose one, and a session flag so the start-up animation plays once. None of it leaves your device.
        </p>
      </Section>
      {hasEvents && (
        <Section id="events" title="Interaction events">
          <dl className="kv kv-mono">
            {Object.entries(EVENTS).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v.label}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      <p className="doc-p">
        Questions? <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
    </article>
  );
}
