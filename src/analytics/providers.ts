import type { ProviderId } from "./config";
import type { EventName, EventProps } from "./events";

export interface Provider {
  id: ProviderId;
  load(): void;
  /** Returns true if the provider recorded the pageview. */
  pageview(path: string, title?: string): boolean;
  /** Returns true if the provider supports and recorded the event. */
  event(name: EventName, props: EventProps): boolean;
}

function inject(src: string, attrs: Record<string, string>, onload?: () => void) {
  const s = document.createElement("script");
  s.src = src;
  s.defer = true;
  s.async = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  if (onload) s.addEventListener("load", onload, { once: true });
  document.head.appendChild(s);
}

/**
 * Cloudflare Web Analytics. The beacon records the initial load and, in SPA mode, every
 * history.pushState/popstate navigation by itself, so pageview() is a no-op here.
 * It strips query strings and #fragments from URLs, and has no custom-event API.
 */
export function cloudflareProvider(token: string): Provider {
  return {
    id: "cloudflare",
    load() {
      inject("https://static.cloudflareinsights.com/beacon.min.js", {
        "data-cf-beacon": JSON.stringify({ token, spa: true }),
      });
    },
    pageview: () => true,
    event: () => false,
  };
}

type GoatCounter = {
  count: (o: { path: string; title?: string; event?: boolean }) => void;
  no_onload?: boolean;
};

/**
 * GoatCounter (optional). Supports custom events, but events carry no properties; they're
 * recorded as paths, so properties are folded into the event name: "github/iratansh/Shrinkr".
 */
export function goatcounterProvider(endpoint: string): Provider {
  const w = window as Window & { goatcounter?: GoatCounter };
  const queue: Array<Parameters<GoatCounter["count"]>[0]> = [];
  let ready = false;
  const send = (o: Parameters<GoatCounter["count"]>[0]) => {
    if (ready && w.goatcounter?.count) w.goatcounter.count(o);
    else if (queue.length < 50) queue.push(o);
  };
  return {
    id: "goatcounter",
    load() {
      // Disable automatic counting; the app reports each route itself.
      w.goatcounter = { ...(w.goatcounter ?? {}), no_onload: true } as GoatCounter;
      inject("https://gc.zgo.at/count.js", { "data-goatcounter": endpoint }, () => {
        ready = true;
        queue.splice(0).forEach((o) => w.goatcounter?.count(o));
      });
    },
    pageview(path, title) {
      send({ path, title });
      return true;
    },
    event(name, props) {
      const suffix = Object.values(props).filter(Boolean).join("/");
      send({ path: suffix ? `${name}/${suffix}` : name, title: name, event: true });
      return true;
    },
  };
}
