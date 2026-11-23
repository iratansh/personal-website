# Analytics

Two separate concerns, kept separate on purpose:

| Concern                          | Tool                                     | Status             |
| -------------------------------- | ---------------------------------------- | ------------------ |
| **Basic traffic analytics**      | Cloudflare Web Analytics (JS beacon)     | ✅ on               |
| **Custom interaction events**    | GoatCounter                              | ⏸ ready, needs your site code |
| **Custom in-site dashboard**     | n/a                                      | ❌ not built (see below) |

Everything works on GitHub Pages: no backend, no API credentials anywhere.

---

## 1. Basic traffic: Cloudflare Web Analytics

**Where to see the data:** Cloudflare dashboard → Web Analytics → this site.

Available there: visits and page views over time, per-page breakdown, referrers, countries,
browsers / OS / device type, and Core Web Vitals from real visitors.

**How it's installed.** The beacon token from your dashboard snippet is in
`src/analytics/config.ts` (`CLOUDFLARE_BEACON_TOKEN`). It's a public identifier, the same value
that would sit in the HTML snippet. The beacon is loaded by `src/analytics/providers.ts`, not
pasted into `index.html`, so that it:

- loads in **production builds only**, so `npm run dev` on localhost doesn't pollute your stats;
- respects **Do Not Track**, **Global Privacy Control**, and the on-site **opt-out**
  (`/personal-website/privacy`). The beacon itself does not check any of these;
- loads after the page is idle, so it never competes with first render.

It's the same `beacon.min.js` with the same token, so Cloudflare sees no difference.
If you'd rather use the raw snippet in `index.html`, delete the token from `config.ts` first
(to avoid loading the beacon twice), and remove the opt-out and DNT claims from `src/views/Privacy.tsx`,
because they would no longer be true.

**Facts verified while setting this up**

- **SPA routing works.** In `beacon.min.js`, an unset `spa` option defaults to tracking
  History API navigation. This site uses real paths (`/personal-website/registry/papertrade`),
  so each project page is counted separately. The beacon strips `#fragments` and query strings,
  which is why the site moved off hash routing.
- **No client-side state.** The current beacon never reads or writes `document.cookie`,
  `localStorage`, `sessionStorage` or IndexedDB, and doesn't use canvas.
- **Cloudflare Web Analytics has no custom events.** The FAQ asks "Does Web Analytics support
  custom events?" and answers "Not yet, but we may add support for this in the future."
- **UTM / query strings are not logged.** This is by design, per the FAQ.
- **Data**: unsampled for 7 days, then aggregated to about 10%; about six months of history.
  Ad blockers can block the beacon, so treat counts as a floor.
- **Hostname**: the Cloudflare site must be configured for `iratansh.github.io`.

## 2. Why there is no custom Cloudflare dashboard (yet)

Investigated before building anything:

- Cloudflare's docs mention that Web Analytics data can be queried through the **GraphQL
  Analytics API**, but the relevant datasets (`rumPageloadEventsAdaptiveGroups`,
  `rumWebVitalsEventsAdaptiveGroups`, …) are **not documented**. They appear only in a dataset
  list in the Data Localization docs, and their field names come from community code.
- Using them requires **three values**: an API token (*Account Analytics: Read*), the account
  ID (`accountTag`), and the Web Analytics **site tag**. The site tag is a different ID from the
  beacon token; filtering by the beacon token returns zero rows.
- The token is a **secret**, so the query must run server-side. A GitHub Pages site has no server.

Since the dataset is undocumented, **no `CF_*` credentials are required or read anywhere in this
repo**, and the in-site dashboard shows no traffic numbers. If you want in-site charts later, the
options compatible with static hosting are:

1. **Local only.** Query the API from a script on your machine with the token in a git-ignored env file.
2. **Scheduled export.** A GitHub Action holds the token as a repo secret, queries daily, and
   writes a snapshot somewhere private. Don't publish it to the public Pages site.
3. **Separate API.** A Cloudflare Worker behind Cloudflare Access proxies the GraphQL call. The
   site stays static; the dashboard calls the Worker.

Each one relies on an undocumented dataset that could change without notice. Verify field names
in Cloudflare's GraphQL explorer first.

## 3. Custom interaction events

The event layer is already built (`src/analytics/`): résumé opens, GitHub / LinkedIn / email
clicks, contact copy and compose, project views and section jumps, topology, simulator, terminal
commands (name only), palette use, and easter eggs. Without an event provider these
events stay in the visitor's tab and are sent nowhere.

**Options compatible with GitHub Pages:**

| Option | Fit | Notes |
| --- | --- | --- |
| **GoatCounter** (recommended) | Already integrated, so it's just one env var | Hosted service is free for "reasonable public usage". Events via `goatcounter.count({ path, event: true })`. Events can't carry properties, so they're folded into the name, e.g. `outbound_github/iratansh/Shrinkr/registry`. Localhost is ignored by default. |
| Umami Cloud | Would need an adapter (~30 lines) | Free Hobby plan: 100K events/month, 1 site, 6-month retention. Supports event properties. |
| Cloudflare Zaraz | ✕ not compatible | Needs a domain proxied by Cloudflare; `github.io` can't be. Would work only with a custom domain. |
| Workers Analytics Engine | Possible later | Needs a Worker endpoint you deploy and maintain. |

**To enable GoatCounter:** create a site at goatcounter.com, then set
`GOATCOUNTER_ENDPOINT = "https://<code>.goatcounter.com/count"` in `src/analytics/config.ts`.
(Alternatively, set the repo variable `VITE_GOATCOUNTER_ENDPOINT`, which overrides it.)
To exclude your own visits, open `https://iratansh.github.io/personal-website/#toggle-goatcounter` once
in each browser you use.

**GoatCounter privacy, verified:** its privacy policy says it "doesn't store IP addresses, the full
User-Agent header, or any tracker ID". Sessions are `concat(site, User-Agent, IP)`, held in server
memory for at most 8 hours. `count.js` sets no cookies; its only browser-storage access is the
owner's `skipgc` self-exclusion flag. GoatCounter's GDPR page says a consent notice is "probably"
not required. `count.js` does not check Do Not Track itself; this site's loader does that.
The hosted service is "free for reasonable public usage", and a personal site qualifies.

## 4. Dev-only status console

`npm run dev` → **07 Site Telemetry**. It's compiled out of production builds. It shows:

- whether the beacon is configured, plus a link to the Cloudflare dashboard;
- a provider capability matrix, including whether each provider has a read API;
- events fired in **your own tab** and the provider each one would go to (real, in memory only);
- Web Vitals measured in your own tab (real, local, not representative of production).

It never shows simulated or invented traffic numbers.

## Event catalog

Defined in `src/analytics/events.ts`. Link clicks are tracked by one delegated listener in
`src/analytics/index.ts`. Add `data-track-source="…"` to a container to label clicks inside it.

| Event | Properties |
| --- | --- |
| `resume_download` | source |
| `outbound_github` | target, source |
| `outbound_linkedin` | source |
| `outbound_link` | host, source |
| `contact_mailto` | source |
| `contact_copy_email` | source |
| `contact_compose` | none |
| `project_view` | project |
| `project_section` | project, section |
| `topology_select` | node |
| `lab_interaction` | action |
| `terminal_open` | none |
| `terminal_command` | command (name only, never arguments) |
| `palette_open` | none |
| `palette_select` | item |
| `easter_egg` | name |

## Sources

- Cloudflare Web Analytics FAQ: https://developers.cloudflare.com/web-analytics/faq/
- GraphQL datasets list (RUM datasets): https://developers.cloudflare.com/data-localization/metadata-boundary/graphql-datasets/
- Community: Web Analytics data via GraphQL: https://community.cloudflare.com/t/downloading-web-analytics-data/473295
- Zaraz on non-proxied domains: https://developers.cloudflare.com/zaraz/advanced/domains-not-proxied/
- GoatCounter: https://www.goatcounter.com/ · privacy https://www.goatcounter.com/privacy · GDPR https://www.goatcounter.com/help/gdpr · sessions https://www.goatcounter.com/help/sessions · terms https://www.goatcounter.com/help/terms · events https://www.goatcounter.com/help/events · JS https://www.goatcounter.com/help/js · SPA https://www.goatcounter.com/help/spa
- Umami pricing: https://umami.is/pricing
