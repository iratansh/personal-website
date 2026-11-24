import { Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, FileText, FolderOpen, Search, X } from "lucide-react";
import { APPS } from "../apps";
import { DESKTOP_ITEMS, getNode } from "../fs";
import { useOS } from "../store";
import { useSettings } from "../settings";
import { AppIcon } from "../ui/AppIcon";
import { Wallpaper } from "./Wallpaper";
import { Mark } from "./MenuBar";
import { Loading } from "../ui/Loading";
import { profile } from "../../data/profile";
import { experience } from "../../data/experience";

const HOME_ITEMS = [...DESKTOP_ITEMS, "app:browser", "notes", "app:settings"];
const DOCK = ["projects", "resume", "app:terminal", "app:contact"];

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setT(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>;
}

/** Phones get one full-screen app at a time; back walks the stack of opened windows. */
export function MobileShell() {
  const os = useOS();
  const { settings } = useSettings();
  const stack = [...os.wins].filter((w) => !w.minimized).sort((a, b) => a.z - b.z);
  const top = stack[stack.length - 1];
  const now = experience[0];

  return (
    <div className="m-shell">
      <Wallpaper id={settings.wallpaper} />
      <header className="m-status">
        <span className="m-brand">
          <Mark size={14} /> iratanshOS
        </span>
        <Clock />
      </header>

      <main className="m-home" aria-hidden={!!top || undefined}>
        <section className="m-hello">
          <span className="widget-kicker">
            <span className="dot" /> {now.role} · {now.shortName}
          </span>
          <h1>{profile.name}</h1>
          <p>{profile.role}</p>
          <div className="m-hello-actions">
            <button className="btn btn-primary" onClick={() => os.open("resume", { source: "mobile-home" })}>
              <FileText size={14} /> Résumé
            </button>
            <button className="btn" onClick={() => os.open("projects", { source: "mobile-home" })}>
              <FolderOpen size={14} /> Projects
            </button>
            <button className="btn btn-icon" onClick={() => os.setLauncherOpen(true)} aria-label="Search">
              <Search size={16} />
            </button>
          </div>
        </section>
        <ul className="m-grid">
          {HOME_ITEMS.map((id) => {
            const n = getNode(id);
            if (!n) return null;
            return (
              <li key={id}>
                <button className="m-app" onClick={() => os.open(id, { source: "mobile-home" })}>
                  <AppIcon spec={n.icon} size={56} locked={n.locked} />
                  <span>{n.name.replace(/\.(txt|md)$/, "")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      <nav className="m-dock surface-glass" aria-label="Dock">
        {DOCK.map((id) => {
          const n = getNode(id)!;
          return (
            <button key={id} onClick={() => os.open(id, { source: "mobile-dock" })} aria-label={n.name}>
              <AppIcon spec={n.icon} size={50} />
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {top && (
          <motion.section
            key={top.id}
            className="m-sheet"
            role="dialog"
            aria-label={top.title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", transition: { duration: 0.22 } }}
            transition={{ duration: 0.32, ease: [0.2, 0.9, 0.25, 1] }}
          >
            <header className="m-sheet-bar">
              <button onClick={() => os.close(top.id)} aria-label={stack.length > 1 ? "Back" : "Home"}>
                <ChevronLeft size={20} />
                <span>{stack.length > 1 ? stack[stack.length - 2].title.replace(/\.(txt|md)$/, "") : "Home"}</span>
              </button>
              <strong>{top.title}</strong>
              <button onClick={() => stack.forEach((w) => os.close(w.id))} aria-label="Close all and go home">
                <X size={18} />
              </button>
            </header>
            <div className="m-sheet-body">
              <Suspense fallback={<Loading />}>
                <MobileApp id={top.id} />
              </Suspense>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileApp({ id }: { id: string }) {
  const os = useOS();
  const win = os.wins.find((w) => w.id === id);
  if (!win) return null;
  const App = APPS[win.app].component;
  return <App win={win} arg={win.arg} />;
}
