/**
 * URL paths for filesystem nodes. Kept free of React, icons, and import.meta.env so the
 * build (vite.config.ts) can import it to write a static page for every path on GitHub Pages.
 */
import { projects } from "../data/projects";
import { notes } from "../data/knowledge";
import { contributions, STATUS_LABEL } from "../data/opensource";
import { experience } from "../data/experience";

/** Node id → path (relative to the site base, no leading slash). */
export function nodePaths(): Record<string, string> {
  const map: Record<string, string> = {
    projects: "projects",
    opensource: "open-source",
    "oss-readme": "open-source/readme",
    documents: "documents",
    notes: "notes",
    experiments: "experiments",
    applications: "applications",
    system: "system",
    resume: "resume",
    about: "about",
    skills: "skills",
    experience: "experience",
    help: "help",
    privacy: "privacy",
    "app:homelab": "homelab",
    "app:terminal": "terminal",
    "app:contact": "contact",
    "app:browser": "browser",
    "app:settings": "settings",
    "app:about": "about-iratanshos",
    "app:analytics": "analytics",
  };
  for (const p of projects) if (p.kind !== "upstream") map[`project:${p.id}`] = `projects/${p.id}`;
  for (const n of notes) map[`note:${n.id}`] = `notes/${n.id}`;
  for (const c of contributions) map[`oss:${c.id}`] = `open-source/${c.id}`;
  return map;
}

/** Paths from the previous version of the site, kept so old links still land somewhere sensible. */
function legacyPaths(): Record<string, string> {
  const map: Record<string, string> = {
    registry: "projects",
    lab: "app:homelab",
    knowledge: "notes",
    contact: "app:contact",
    experience: "experience",
    privacy: "privacy",
  };
  for (const p of projects) {
    const oss = contributions.find((c) => c.projectId === p.id);
    map[`registry/${p.id}`] = oss ? `oss:${oss.id}` : `project:${p.id}`;
  }
  for (const n of notes) map[`knowledge/${n.id}`] = `note:${n.id}`;
  for (const r of experience) map[`experience/${r.id}`] = "experience";
  return map;
}

/** Resolves a path (relative to base) to a node id. */
export function pathToNode(path: string): string | undefined {
  const clean = path.replace(/^\/+|\/+$/g, "");
  if (!clean) return undefined;
  const byPath = Object.entries(nodePaths()).find(([, p]) => p === clean)?.[0];
  return byPath ?? legacyPaths()[clean];
}

/** Every path that should exist as a static page (current + legacy). */
export function publicRoutePaths(): string[] {
  return [...new Set([...Object.values(nodePaths()), ...Object.keys(legacyPaths())])];
}

const NAME = "Ishaan Ratanshi";

/** Per-page title and description, written into each static page so shared links preview properly. */
export function routeMeta(path: string): { title: string; description: string } | undefined {
  const id = pathToNode(path);
  if (!id) return undefined;
  const t = (title: string, description: string) => ({ title: `${title} · ${NAME}`, description });
  const [kind, rest] = id.includes(":") ? [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)] : [id, ""];
  if (kind === "project") {
    const p = projects.find((x) => x.id === rest);
    return p && t(p.name, p.tagline);
  }
  if (kind === "note") {
    const n = notes.find((x) => x.id === rest);
    return n && t(n.title, n.dek);
  }
  if (kind === "oss") {
    const c = contributions.find((x) => x.id === rest);
    return c && t(`${c.repo} #${c.number}`, `${STATUS_LABEL[c.status]}: ${c.title}. ${c.summary}`);
  }
  const fixed: Record<string, [string, string]> = {
    projects: ["Projects", "Systems I designed and built, with architecture, key decisions, and measured results."],
    opensource: ["Open Source", "Contributions to open-source projects, with their real status on GitHub."],
    "oss-readme": ["Open Source", "Contributions to open-source projects, with their real status on GitHub."],
    documents: ["Documents", "Résumé, background, skills, experience, and engineering notes."],
    notes: ["Notes", "Architecture breakdowns and engineering notes."],
    experiments: ["Experiments", "Side projects, research repositories, and simulations."],
    applications: ["Applications", "Every app in iratanshOS."],
    system: ["System", "Settings, help, and privacy."],
    resume: ["Résumé", "Ishaan Ratanshi's résumé: read it, zoom, print, or download the PDF."],
    about: ["About Me", "Background, interests, and how I like to build."],
    skills: ["Technical Skills", "Languages, cloud, backend, data, observability, and AI tooling, with where each was used."],
    experience: ["Experience", experience.map((r) => `${r.role}, ${r.company}`).join(" · ")],
    help: ["Keyboard Shortcuts", "Every shortcut and gesture iratanshOS understands."],
    privacy: ["Privacy", "What this site measures, what it doesn't, and how to opt out."],
    "app:homelab": ["Home Lab", "Architectures, infrastructure, experiments, and a live backpressure simulation."],
    "app:terminal": ["Terminal", "A simulated shell for exploring this portfolio."],
    "app:contact": ["Contact", "Email, GitHub, LinkedIn, and the résumé in one place."],
    "app:browser": ["Browser", "Bookmarks for repositories, profiles, and project links."],
    "app:settings": ["Settings", "Appearance, wallpaper, motion, sound, and privacy."],
    "app:about": ["About iratanshOS", "Ishaan Ratanshi's portfolio, built as a small operating system."],
    "app:analytics": ["Analytics", "Private: site analytics live in the owner's dashboards."],
  };
  const f = fixed[id];
  return f && t(f[0], f[1]);
}
