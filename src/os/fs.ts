/**
 * The virtual filesystem. Every folder, document, and app shortcut in iratanshOS is a node
 * built here from the content in /src/data, so adding a project, note, or contribution to the
 * data files is enough for it to appear in Files, the launcher, the terminal, and search.
 */
import {
  AppWindow,
  BookOpen,
  CircleDot,
  Briefcase,
  ChartColumn,
  FileText,
  FlaskConical,
  Folder,
  GitPullRequest,
  Globe,
  HardDrive,
  Info,
  Keyboard,
  Mail,
  NotebookPen,
  Settings,
  Shield,
  SquareTerminal,
  User,
  Wrench,
} from "lucide-react";
import { projects } from "../data/projects";
import { notes } from "../data/knowledge";
import { contributions, STATUS_LABEL } from "../data/opensource";
import { lastCommit } from "../data/repoActivity";
import { lab } from "../data/lab";
import { experience } from "../data/experience";
import { profile } from "../data/profile";
import type { AppId, FsNode } from "./types";
import { nodePaths } from "./paths";

const LAST_UPDATED = "2026-11";

const nodes: Record<string, FsNode> = {};
const add = (n: FsNode) => {
  nodes[n.id] = n;
  return n.id;
};

/* ---- Applications ---- */
const appNode = (app: AppId, name: string, n: Partial<FsNode> & Pick<FsNode, "icon" | "description">): string =>
  add({
    id: `app:${app}`,
    name,
    kind: "app",
    parent: "applications",
    open: { app },
    kindLabel: "Application",
    ...n,
  });

const apps = [
  appNode("files", "Files", {
    icon: { shape: "app", tint: "blue", glyph: Folder },
    description: "Browse folders, projects, and documents.",
    keywords: ["finder", "explorer", "browse"],
  }),
  appNode("homelab", "Home Lab", {
    icon: { shape: "app", tint: "emerald", glyph: FlaskConical },
    description: "Infrastructure dashboard: architectures, experiments, and a live backpressure simulation.",
    keywords: ["infrastructure", "telemetry", "architecture", "experiments", "simulation", "lab"],
  }),
  appNode("terminal", "Terminal", {
    icon: { shape: "app", tint: "ink", glyph: SquareTerminal },
    description: "A simulated shell for exploring this portfolio. Type `help`.",
    keywords: ["shell", "console", "cli", "command"],
  }),
  appNode("browser", "Browser", {
    icon: { shape: "app", tint: "cyan", glyph: Globe },
    description: "Bookmarks for repositories, profiles, and project links.",
    keywords: ["web", "links", "github", "linkedin"],
  }),
  appNode("pdf", "PDF Viewer", {
    open: { app: "pdf", arg: "resume" },
    icon: { shape: "app", tint: "rose", glyph: FileText },
    description: "Read, zoom, print, and download the résumé.",
    keywords: ["pdf", "resume", "cv"],
  }),
  appNode("contact", "Contact", {
    icon: { shape: "app", tint: "violet", glyph: Mail },
    description: "Email, GitHub, LinkedIn, and the résumé in one place.",
    keywords: ["email", "mail", "reach", "hire", "linkedin", "github"],
  }),
  appNode("settings", "Settings", {
    parent: "system",
    icon: { shape: "app", tint: "slate", glyph: Settings },
    description: "Appearance, wallpaper, motion, sound, and privacy.",
    keywords: ["preferences", "theme", "wallpaper", "dark", "light", "motion", "privacy"],
  }),
  appNode("analytics", "Analytics", {
    icon: { shape: "app", tint: "blue", glyph: ChartColumn },
    description: "Private: site analytics live in the owner's dashboards.",
    keywords: ["traffic", "visitors", "stats"],
    locked: true,
  }),
  appNode("about", "About iratanshOS", {
    parent: "system",
    icon: { shape: "app", tint: "emerald", glyph: Info },
    description: "Version, technologies, and source code.",
    keywords: ["version", "source", "credits"],
  }),
];

/* Projects. Upstream contributions (ASO) live in Open Source instead, documented by their contribution entry. */
const ownProjects = projects.filter((p) => p.kind !== "upstream");
const projectIds = ownProjects.map((p) =>
  add({
    id: `project:${p.id}`,
    name: `${p.name}.md`,
    kind: "document",
    parent: "projects",
    open: { app: "reader", arg: `project:${p.id}` },
    icon: { shape: "doc", ext: "md", tint: "cyan" },
    kindLabel: "Project document",
    modified: (p.repo && lastCommit[p.repo]) || LAST_UPDATED,
    description: p.tagline,
    keywords: [p.language, ...p.stack, ...p.domains, p.kind],
  }),
);

/* ---- Open source ---- */
const ossIds = [
  add({
    id: "oss-readme",
    name: "README.md",
    kind: "document",
    parent: "opensource",
    open: { app: "reader", arg: "oss-readme" },
    icon: { shape: "doc", ext: "md", glyph: BookOpen },
    kindLabel: "Markdown document",
    modified: LAST_UPDATED,
    description: "Why I contribute, and what's in this folder.",
  }),
  ...contributions.map((c) =>
    add({
      id: `oss:${c.id}`,
      name: `${c.repo.split("/")[1]} #${c.number}`,
      kind: "document",
      parent: "opensource",
      open: { app: "reader", arg: `oss:${c.id}` },
      icon: {
        shape: "doc",
        ext: c.kind,
        tint: c.status === "merged" ? "violet" : c.status === "in-progress" ? "amber" : "emerald",
        glyph: c.kind === "issue" ? CircleDot : GitPullRequest,
      },
      kindLabel: `${c.kind === "issue" ? "Issue" : "Pull request"} · ${STATUS_LABEL[c.status].toLowerCase()}`,
      modified: c.date,
      description: c.title,
      keywords: [c.repo, c.status, ...c.tech],
    }),
  ),
];

/* ---- Notes ---- */
const noteIds = notes.map((n) =>
  add({
    id: `note:${n.id}`,
    name: `${n.title}.md`,
    kind: "document",
    parent: "notes",
    open: { app: "reader", arg: `note:${n.id}` },
    icon: { shape: "doc", ext: "md", tint: "amber", glyph: NotebookPen },
    kindLabel: "Engineering note",
    modified: n.date,
    description: n.dek,
    keywords: n.tags,
  }),
);

/* ---- Experiments (open in Home Lab) ---- */
const experimentIds = lab.map((l) =>
  add({
    id: `lab:${l.id}`,
    name: l.name,
    kind: "document",
    parent: "experiments",
    open: { app: "homelab", arg: `experiments:${l.id}` },
    icon: { shape: "doc", ext: l.kind === "interactive" ? "sim" : "repo", tint: "emerald", glyph: FlaskConical },
    kindLabel: l.kind === "interactive" ? "Interactive simulation" : l.roleId ? "Research repository" : "Repository",
    modified: l.repo ? lastCommit[l.repo] : undefined,
    description: l.description,
    keywords: [...l.tags, l.language ?? ""],
  }),
);

/* ---- Documents ---- */
const doc = (id: string, name: string, n: Partial<FsNode> & Pick<FsNode, "icon" | "description">) =>
  add({
    id,
    name,
    kind: "document",
    parent: "documents",
    open: { app: "reader", arg: id },
    kindLabel: "Text document",
    modified: LAST_UPDATED,
    ...n,
  });

const resume = add({
  id: "resume",
  name: "Resume.pdf",
  kind: "document",
  parent: "documents",
  open: { app: "pdf", arg: "resume" },
  icon: { shape: "doc", ext: "pdf", tint: "rose" },
  kindLabel: "PDF document",
  modified: LAST_UPDATED,
  description: `${profile.name}'s résumé, updated ${profile.lastUpdated}.`,
  keywords: ["cv", "resume", "résumé", "download"],
});
const about = doc("about", "About Me.txt", {
  icon: { shape: "doc", ext: "txt", glyph: User },
  description: "Background, interests, and how I like to build.",
  keywords: ["bio", "who", "education", "university"],
});
const skills = doc("skills", "Technical Skills.txt", {
  icon: { shape: "doc", ext: "txt", glyph: Wrench },
  description: "Languages, cloud, backend, data, observability, and AI tooling.",
  keywords: ["stack", "technologies", "languages", "tools"],
});
const exp = doc("experience", "Experience.md", {
  icon: { shape: "doc", ext: "md", glyph: Briefcase },
  kindLabel: "Markdown document",
  description: experience.map((r) => r.shortName).join(", ") + ": roles, impact, and stacks.",
  keywords: ["work", "jobs", "rbc", "elk valley", "co-op", "internship", ...experience.map((r) => r.company)],
});

/* ---- System ---- */
const help = add({
  id: "help",
  name: "Keyboard Shortcuts.md",
  kind: "document",
  parent: "system",
  open: { app: "reader", arg: "help" },
  icon: { shape: "doc", ext: "md", glyph: Keyboard },
  kindLabel: "Help document",
  description: "Every shortcut and gesture iratanshOS understands.",
  keywords: ["help", "shortcuts", "keys", "hotkeys"],
});
const privacy = add({
  id: "privacy",
  name: "Privacy.md",
  kind: "document",
  parent: "system",
  open: { app: "reader", arg: "privacy" },
  icon: { shape: "doc", ext: "md", glyph: Shield },
  kindLabel: "Policy document",
  description: "What this site measures, what it doesn't, and how to opt out.",
  keywords: ["analytics", "tracking", "cookies", "opt out"],
});

/* ---- Folders ---- */
const folder = (id: string, name: string, parent: string | null, children: string[], n: Partial<FsNode> = {}) =>
  add({
    id,
    name,
    kind: "folder",
    parent,
    children,
    icon: { shape: "folder", tint: "blue" },
    kindLabel: "Folder",
    modified: LAST_UPDATED,
    ...n,
  });

folder("projects", "Projects", "desktop", projectIds, {
  icon: { shape: "folder", tint: "cyan" },
  description: `${ownProjects.length} systems with architecture, decisions, and measured results.`,
  keywords: ["portfolio", "work", "registry"],
});
folder("opensource", "Open Source", "desktop", ossIds, {
  icon: { shape: "folder", tint: "violet", glyph: GitPullRequest },
  description: `${contributions.length} contributions to repositories I don't own.`,
  keywords: ["oss", "contributions", "pull requests", "github"],
});
folder("notes", "Notes", "documents", noteIds, {
  icon: { shape: "folder", tint: "amber" },
  description: "Architecture breakdowns and engineering notes.",
  keywords: ["blog", "articles", "writing", "knowledge"],
});
folder("experiments", "Experiments", "documents", experimentIds, {
  icon: { shape: "folder", tint: "emerald", glyph: FlaskConical },
  description: "Side projects, research repositories, and simulations.",
  keywords: ["lab", "research", "side projects"],
});
folder("documents", "Documents", "root", [resume, about, skills, exp, "notes", "experiments"], {
  description: "Résumé, background, skills, experience, and notes.",
});
folder("applications", "Applications", "root", apps.filter((a) => nodes[a].parent === "applications"), {
  icon: { shape: "folder", tint: "slate", glyph: AppWindow },
  description: "Every app on this system.",
});
folder("system", "System", "root", ["app:settings", "app:about", help, privacy], {
  icon: { shape: "folder", tint: "slate", glyph: HardDrive },
  description: "Settings, help, and privacy.",
});
folder(
  "desktop",
  "Desktop",
  "root",
  ["projects", "app:homelab", resume, "opensource", about, skills, "app:terminal", "app:analytics", "app:contact"],
  { icon: { shape: "folder", tint: "blue", glyph: AppWindow }, description: "Everything on the desktop." },
);
folder("root", "iratanshOS", null, ["desktop", "documents", "applications", "system"], {
  icon: { shape: "folder", tint: "slate", glyph: HardDrive },
  description: "The whole system.",
});

export const fs = nodes;
export const DESKTOP_ITEMS = nodes.desktop.children!;
export const NODE_PATHS = nodePaths();

export const getNode = (id: string): FsNode | undefined => nodes[id];

/** Visible children of a folder, in declared order. */
export function listFolder(id: string): FsNode[] {
  return (nodes[id]?.children ?? []).map((c) => nodes[c]).filter((n): n is FsNode => !!n && !n.hidden);
}

/** Ancestors from the root down to (and including) the node. */
export function pathOf(id: string): FsNode[] {
  const out: FsNode[] = [];
  let cur: FsNode | undefined = nodes[id];
  while (cur) {
    out.unshift(cur);
    cur = cur.parent ? nodes[cur.parent] : undefined;
  }
  return out;
}

/** Unix-style path for the terminal, e.g. ~/Desktop/Projects. Root is "~". */
export function unixPath(id: string): string {
  const parts = pathOf(id)
    .slice(1)
    .map((n) => n.name);
  return parts.length ? `~/${parts.join("/")}` : "~";
}

export const allNodes = (): FsNode[] => Object.values(nodes);
