import { domains } from "../../data/domains";
import { projects } from "../../data/projects";
import { experience } from "../../data/experience";
import { lab } from "../../data/lab";
import { profile } from "../../data/profile";
import type { DomainId } from "../../data/types";
import type { Route } from "../../lib/routes";

export type TopoKind = "core" | "domain" | "project" | "role" | "lab";

export interface TopoNode {
  id: string;
  kind: TopoKind;
  label: string;
  sub: string;
  hue: string;
  domains: DomainId[];
  route?: Route;
  // d3-force fields
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface TopoLink {
  source: string | TopoNode;
  target: string | TopoNode;
  kind: "spine" | "leaf";
}

export const HUES: Record<string, string> = {
  emerald: "#34e0a1",
  cyan: "#5ad8ff",
  blue: "#6b98ff",
  violet: "#a68bff",
};

/** Builds the graph from the content files, so new projects appear automatically. */
export function buildTopology() {
  const nodes: TopoNode[] = [
    {
      id: "core",
      kind: "core",
      label: profile.initials,
      sub: profile.name,
      hue: HUES.emerald,
      domains: [],
    },
  ];
  const links: TopoLink[] = [];

  for (const d of domains) {
    nodes.push({ id: `d:${d.id}`, kind: "domain", label: d.label, sub: d.short, hue: HUES[d.hue], domains: [d.id] });
    links.push({ source: "core", target: `d:${d.id}`, kind: "spine" });
  }

  const addItem = (n: TopoNode) => {
    nodes.push(n);
    for (const d of n.domains) links.push({ source: n.id, target: `d:${d}`, kind: "leaf" });
  };

  for (const p of projects)
    addItem({
      id: `p:${p.id}`,
      kind: "project",
      label: p.name,
      sub: p.tagline,
      hue: HUES.cyan,
      domains: p.domains,
      route: { module: "registry", param: p.id },
    });
  for (const r of experience)
    addItem({
      id: `r:${r.id}`,
      kind: "role",
      label: r.shortName,
      sub: `${r.role} — ${r.company}`,
      hue: HUES.emerald,
      domains: r.domains,
      route: { module: "experience", param: r.id },
    });
  for (const l of lab)
    addItem({
      id: `l:${l.id}`,
      kind: "lab",
      label: l.name,
      sub: l.description,
      hue: HUES.violet,
      domains: l.domains,
      route: { module: "lab", param: l.id },
    });

  return { nodes, links };
}

export const KIND_LABEL: Record<TopoKind, string> = {
  core: "Operator",
  domain: "Domain",
  project: "Service",
  role: "Role",
  lab: "Experiment",
};
