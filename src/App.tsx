import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { NexusProvider, useNexus } from "./lib/nexus";
import { modules, moduleById, toHref, type ModuleId } from "./lib/routes";
import { track } from "./analytics";
import { isTypingTarget } from "./lib/hooks";
import { profile } from "./data/profile";
import { TopBar } from "./components/shell/TopBar";
import { MobileNav, Rail } from "./components/shell/Rail";
import { Backdrop, Toasts } from "./components/shell/Backdrop";
import { Terminal } from "./components/terminal/Terminal";
import { CommandPalette } from "./components/palette/CommandPalette";
import { BootSequence } from "./components/boot/BootSequence";
import Overview from "./views/Overview";

// Every module except the landing view is split into its own chunk.
const NotFound = lazy(() => import("./views/NotFound"));
const views: Record<ModuleId, React.ComponentType> = {
  overview: Overview,
  registry: lazy(() => import("./views/Registry")),
  experience: lazy(() => import("./views/Experience")),
  lab: lazy(() => import("./views/Lab")),
  knowledge: lazy(() => import("./views/Knowledge")),
  contact: lazy(() => import("./views/Contact")),
  privacy: lazy(() => import("./views/Privacy")),
  // The analytics dashboard is compiled out of production builds entirely.
  telemetry: import.meta.env.DEV ? lazy(() => import("./views/Telemetry")) : NotFound,
};

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function ModuleLoading() {
  return (
    <div className="module-loading">
      <div className="module-loading-inner">
        <span className="label">mounting module</span>
        <span className="module-loading-bar" />
      </div>
    </div>
  );
}

function useGlobalKeys() {
  const { setPaletteOpen, setTerminalOpen, paletteOpen, terminalOpen, navigate, setOverdrive, overdrive, toast } = useNexus();
  const konami = useRef<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }

      konami.current = [...konami.current, e.key].slice(-KONAMI.length);
      if (konami.current.join() === KONAMI.join()) {
        konami.current = [];
        setOverdrive(!overdrive);
        track("easter_egg", { name: "konami" });
        toast(overdrive ? "Overdrive disengaged" : "OVERDRIVE ENGAGED — accent bus rerouted", "violet");
        return;
      }

      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setTerminalOpen((o) => !o);
        return;
      }
      if (paletteOpen || terminalOpen) {
        if (e.key === "Escape") {
          setPaletteOpen(false);
          setTerminalOpen(false);
        }
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= modules.length) navigate({ module: modules[n - 1].id });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen, setTerminalOpen, paletteOpen, terminalOpen, navigate, setOverdrive, overdrive, toast]);
}

function Shell() {
  const { route, reducedMotion } = useNexus();
  const mainRef = useRef<HTMLElement>(null);
  const View = route.notFound ? NotFound : views[route.module];
  const key = `${route.notFound ? "404" : route.module}/${route.module === "registry" ? route.param ?? "" : ""}`;

  useGlobalKeys();

  useEffect(() => {
    const m = moduleById[route.module];
    document.title = route.notFound
      ? "Not found — NEXUS"
      : route.module === "overview"
        ? `${profile.name} — NEXUS`
        : `${route.param ? route.param + " · " : ""}${m.label} — NEXUS`;
    const url = `https://iratansh.github.io${toHref(route)}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
  }, [route]);

  useEffect(() => {
    if (route.module === "experience" || route.module === "lab") return; // these scroll to their own anchors
    mainRef.current?.scrollTo({ top: 0 });
  }, [key, route.module]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Backdrop />
      <div className="app">
        <TopBar />
        <Rail />
        <main id="main" className="main" ref={mainRef} tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<ModuleLoading />}>
                <View />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileNav />
      </div>
      <Terminal />
      <CommandPalette />
      <Toasts />
    </MotionConfig>
  );
}

function shouldBoot() {
  try {
    if (sessionStorage.getItem("nexus.booted")) return false;
  } catch {
    /* ignore */
  }
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function App() {
  const [booting, setBooting] = useState(shouldBoot);
  const done = useCallback(() => {
    setBooting(false);
    try {
      sessionStorage.setItem("nexus.booted", "1");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <NexusProvider>
      <Shell />
      {booting && <BootSequence onDone={done} />}
    </NexusProvider>
  );
}
