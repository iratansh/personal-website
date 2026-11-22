export type ModuleId =
  | "overview"
  | "registry"
  | "experience"
  | "lab"
  | "knowledge"
  | "contact"
  | "privacy"
  | "telemetry";

export interface ModuleDef {
  id: ModuleId;
  index: string;
  label: string;
  path: string; // filesystem-ish path used in the breadcrumb & terminal
  blurb: string;
  /** Reachable by URL but not listed in navigation. */
  hidden?: boolean;
  /** Only exists in local development builds (never shipped to production). */
  devOnly?: boolean;
}

const ALL_MODULES: ModuleDef[] = [
  { id: "overview", index: "01", label: "System Overview", path: "~", blurb: "Who I am, live admission-control demo, measured outputs" },
  { id: "registry", index: "02", label: "Project Registry", path: "~/registry", blurb: "Projects as deployed services" },
  { id: "experience", index: "03", label: "Experience", path: "~/experience", blurb: "Operational timeline" },
  { id: "lab", index: "04", label: "Technical Lab", path: "~/lab", blurb: "Experiments and curiosity builds" },
  { id: "knowledge", index: "05", label: "Knowledge Base", path: "~/kb", blurb: "Architecture breakdowns and notes" },
  { id: "contact", index: "06", label: "Contact", path: "~/contact", blurb: "Open a channel" },
  { id: "privacy", index: "—", label: "Privacy", path: "~/privacy", blurb: "What this site measures", hidden: true },
  {
    id: "telemetry",
    index: "07",
    label: "Site Telemetry",
    path: "~/telemetry",
    blurb: "Private analytics dashboard (local dev only)",
    devOnly: true,
  },
];

const available = ALL_MODULES.filter((m) => !m.devOnly || import.meta.env.DEV);

/** Modules shown in navigation. */
export const modules = available.filter((m) => !m.hidden);

export const moduleById = Object.fromEntries(available.map((m) => [m.id, m])) as Record<ModuleId, ModuleDef>;

export interface Route {
  module: ModuleId;
  param?: string;
  notFound?: boolean;
}

/** Site base, e.g. "/personal-website/". */
export const BASE = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

function segmentsToRoute(segs: string[]): Route {
  const [first, second, third] = segs;
  if (!first) return { module: "overview" };
  if (first in moduleById && !third) {
    return { module: first as ModuleId, param: second ? decodeURIComponent(second) : undefined };
  }
  return { module: "overview", notFound: true };
}

export function parsePath(pathname: string): Route {
  let rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\//, "");
  rel = rel.replace(/index\.html$/, "");
  return segmentsToRoute(rel.split("/").filter(Boolean));
}

/** Legacy `#/registry/x` links from the hash-routed version of the site. */
export function parseLegacyHash(hash: string): Route | null {
  if (!hash.startsWith("#/")) return null;
  return segmentsToRoute(hash.slice(2).split("/").filter(Boolean));
}

export function toHref(route: Route): string {
  if (route.module === "overview" && !route.param) return BASE;
  return `${BASE}${route.module}${route.param ? `/${encodeURIComponent(route.param)}` : ""}`;
}

/**
 * Full path used for analytics ("/personal-website/registry/papertrade"). It matches what
 * Cloudflare records, and lets GoatCounter's dashboard links resolve on iratansh.github.io.
 */
export function toAnalyticsPath(route: Route): string {
  return toHref(route);
}
