/**
 * Shared content types. Everything a visitor reads lives in /src/data —
 * edit those files, not the components, to update the site.
 */

export type DomainId =
  | "infrastructure"
  | "cloud"
  | "distributed"
  | "observability"
  | "backend"
  | "ai";

export interface Domain {
  id: DomainId;
  label: string;
  short: string; // 3-4 letter code used in dense UI
  description: string;
  hue: "emerald" | "cyan" | "blue" | "violet";
}

export interface Metric {
  value: string;
  label: string;
  /** Where the number comes from / caveats. Shown as a footnote. */
  context?: string;
}

export interface ArchNode {
  id: string;
  label: string;
  sub?: string;
  col: number;
  row: number;
  tone?: "client" | "service" | "store" | "queue" | "external" | "observe";
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
}

export interface Decision {
  title: string;
  body: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  kind: "service" | "platform" | "pipeline" | "upstream" | "runtime" | "application";
  language: string;
  domains: DomainId[];
  stack: string[];
  repo?: string;
  links?: { label: string; href: string }[];
  overview: string;
  problem: string;
  architecture: {
    caption: string;
    nodes: ArchNode[];
    edges: ArchEdge[];
  };
  challenges: string[];
  decisions: Decision[];
  metrics: Metric[];
  /** Shown when there are no published numbers. */
  metricsNote?: string;
}

export interface Role {
  id: string;
  company: string;
  shortName: string;
  role: string;
  team?: string;
  location: string;
  start: string; // YYYY-MM
  end: string; // YYYY-MM (inclusive month)
  domains: DomainId[];
  summary: string;
  highlights: string[];
  stack: string[];
}

export interface LabEntry {
  id: string;
  name: string;
  kind: "interactive" | "repo";
  language?: string;
  domains: DomainId[];
  description: string;
  repo?: string;
  tags: string[];
}

export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang?: string; text: string }
  | { type: "callout"; text: string };

export interface Note {
  id: string;
  title: string;
  dek: string;
  kind: "architecture" | "note";
  date: string; // YYYY-MM
  tags: string[];
  /** Project this note is derived from (links back to the registry). */
  projectId?: string;
  source?: { label: string; href: string };
  blocks: NoteBlock[];
}
