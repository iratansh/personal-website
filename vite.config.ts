import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { publicRoutePaths } from "./src/lib/routeTable";

const BASE = "/personal-website/";

/**
 * GitHub Pages has no SPA rewrites, so write a copy of index.html at every known route.
 * Deep links then return 200 (good for SEO and link previews); unknown paths fall back to 404.html.
 */
function staticRoutes(): Plugin {
  let outDir = "dist";
  return {
    name: "nexus-static-routes",
    apply: "build",
    configResolved(c) {
      outDir = resolve(c.root, c.build.outDir);
    },
    closeBundle() {
      const html = readFileSync(join(outDir, "index.html"), "utf8");
      const paths = publicRoutePaths();
      for (const p of paths) {
        const dir = join(outDir, p);
        mkdirSync(dir, { recursive: true });
        const canonical = `https://iratansh.github.io${BASE}${p}`;
        writeFileSync(
          join(dir, "index.html"),
          html
            .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical}`)
            .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`),
        );
      }
      writeFileSync(join(outDir, "404.html"), html);
      console.log(`  static routes: wrote ${paths.length} route pages + 404.html`);
    },
  };
}

export default defineConfig({
    plugins: [react(), staticRoutes()],
    base: BASE,
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            motion: ["framer-motion"],
          },
        },
      },
    },
});
