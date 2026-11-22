/**
 * Route enumeration shared by the app and the build step (vite.config.ts), which writes a
 * static index.html for every path so deep links return 200 on GitHub Pages.
 * Keep this file free of `import.meta.env` so it can be imported from Node.
 */
import { projects } from "../data/projects";
import { experience } from "../data/experience";
import { notes } from "../data/knowledge";
import { lab } from "../data/lab";

/** Public route paths, relative to the site base (no leading slash). */
export function publicRoutePaths(): string[] {
  return [
    "registry",
    ...projects.map((p) => `registry/${p.id}`),
    "experience",
    ...experience.map((r) => `experience/${r.id}`),
    "lab",
    ...lab.map((l) => `lab/${l.id}`),
    "knowledge",
    ...notes.map((n) => `knowledge/${n.id}`),
    "contact",
    "privacy",
  ];
}
