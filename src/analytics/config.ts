/**
 * Analytics configuration (see ANALYTICS.md). Only *public* identifiers belong here: the
 * Cloudflare beacon token and GoatCounter endpoint ship in every page by design.
 * This site has no analytics API credentials, and none may ever be added to frontend code.
 */
const env = import.meta.env;

/** From the Cloudflare dashboard snippet (Web Analytics › Manage site). */
export const CLOUDFLARE_BEACON_TOKEN = "b17a6fbd4ed2485581597830e9e92954";

/**
 * GoatCounter endpoint for custom interaction events. Public by design (it ships in every page).
 * Format: https://<your-code>.goatcounter.com/count. Empty = events stay in the visitor's tab.
 */
export const GOATCOUNTER_ENDPOINT = "https://iratansh.goatcounter.com/count";

const flag = (v: string | undefined) => v === "1" || v === "true";

export const analyticsConfig = {
  /** Providers load only in production builds unless VITE_ANALYTICS_IN_DEV is set. */
  active: (env.PROD || flag(env.VITE_ANALYTICS_IN_DEV)) && !flag(env.VITE_ANALYTICS_DISABLED),
  /** Logs every event to the console. Defaults on in dev. */
  debug: env.DEV || flag(env.VITE_ANALYTICS_DEBUG),
  cloudflare: {
    /**
     * Cloudflare Web Analytics site token. Public by design (it ships in every page).
     * Basic traffic analytics. VITE_CF_BEACON_TOKEN overrides it; an empty override keeps the default.
     */
    token: (env.VITE_CF_BEACON_TOKEN as string | undefined)?.trim() || CLOUDFLARE_BEACON_TOKEN,
  },
  goatcounter: {
    /** Optional: custom interaction events. e.g. https://yourcode.goatcounter.com/count */
    endpoint: (env.VITE_GOATCOUNTER_ENDPOINT as string | undefined)?.trim() || GOATCOUNTER_ENDPOINT,
  },
};

export type ProviderId = "cloudflare" | "goatcounter";

export function configuredProviders(): ProviderId[] {
  const out: ProviderId[] = [];
  if (analyticsConfig.cloudflare.token) out.push("cloudflare");
  if (analyticsConfig.goatcounter.endpoint) out.push("goatcounter");
  return out;
}

/** What each provider can record. Used by the privacy page and the dashboard. */
export const PROVIDER_CAPABILITIES: Record<
  ProviderId,
  {
    name: string;
    pageviews: boolean;
    customEvents: boolean;
    webVitals: boolean;
    /** false = verified cookie-free; null = not yet verified, so the privacy page makes no claim. */
    cookies: boolean | null;
    /** Whether a documented, supported API exists for reading the collected data back. */
    readApi: "documented" | "undocumented" | "unverified";
    dashboard: string;
    docs: string;
  }
> = {
  cloudflare: {
    name: "Cloudflare Web Analytics",
    pageviews: true,
    customEvents: false,
    webVitals: true,
    cookies: false, // verified: beacon.min.js never touches cookies, local/session storage, or IndexedDB
    readApi: "undocumented",
    dashboard: "https://dash.cloudflare.com/?to=/:account/web-analytics",
    docs: "https://developers.cloudflare.com/web-analytics/",
  },
  goatcounter: {
    name: "GoatCounter",
    pageviews: true,
    customEvents: true,
    webVitals: false,
    // verified: count.js sets no cookies; it only reads a "skipgc" localStorage flag that the
    // site owner can set via #toggle-goatcounter to exclude their own visits. Sessions are
    // concat(site, User-Agent, IP) held in server memory ≤ 8 h, never written to disk.
    cookies: false,
    readApi: "unverified",
    dashboard: "https://www.goatcounter.com/",
    docs: "https://www.goatcounter.com/help",
  },
};
