import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BriefcaseBusiness, FileText, GitPullRequest, NotebookPen, Sparkles, X, type LucideIcon } from "lucide-react";
import { useOS } from "../store";
import { useSettings } from "../settings";
import { formatDate, MOD } from "../hooks";
import { Mark } from "./MenuBar";
import { profile } from "../../data/profile";
import { experience } from "../../data/experience";
import { contributions } from "../../data/opensource";
import { notes } from "../../data/knowledge";

interface Note {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  date?: string;
  target?: string;
}

/** Dated facts from the content files. Nothing here pretends to be live activity. */
function useNotifications(): Note[] {
  return useMemo(() => {
    const out: Note[] = [
      {
        id: "welcome",
        icon: Sparkles,
        title: "Welcome to iratanshOS",
        body: `Double-click anything on the desktop, or press ${MOD}K to search.`,
        target: "help",
      },
      {
        id: "resume",
        icon: FileText,
        title: "Résumé updated",
        body: `Latest version from ${profile.lastUpdated}.`,
        date: "2026-11",
        target: "resume",
      },
    ];
    for (const c of contributions.filter((x) => x.status !== "merged")) {
      out.push({
        id: `oss-${c.id}-${c.status}`,
        icon: GitPullRequest,
        title:
          c.status === "approved"
            ? "Open-source PR approved"
            : c.status === "in-progress"
              ? "Working on an open-source issue"
              : "Open-source PR under review",
        body: `${c.repo} #${c.number}: ${c.title}`,
        date: c.date,
        target: `oss:${c.id}`,
      });
    }
    const role = experience[0];
    out.push({
      id: `role-${role.id}`,
      icon: BriefcaseBusiness,
      title: `${role.role} at ${role.shortName}`,
      body: `Started ${formatDate(role.start)}. See Experience.md.`,
      date: role.start,
      target: "experience",
    });
    const latest = [...notes].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest)
      out.push({ id: `note-${latest.id}`, icon: NotebookPen, title: "Latest note", body: latest.title, date: latest.date, target: `note:${latest.id}` });
    return out;
  }, []);
}

const DISMISS_KEY = "iratanshos.dismissed";

export function NotificationCenter() {
  const os = useOS();
  const all = useNotifications();
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const save = (ids: string[]) => {
    setDismissed(ids);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
  };
  const visible = all.filter((n) => !dismissed.includes(n.id));
  const now = new Date();

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".nc") && !t.closest(".mb-clock")) os.setCenterOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && os.setCenterOpen(false);
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("keydown", key);
    };
  }, [os]);

  return (
    <motion.aside
      className="nc surface-glass"
      aria-label="Notifications"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.2, 0.9, 0.25, 1] }}
    >
      <div className="nc-today">
        <span className="nc-day">{now.toLocaleDateString([], { weekday: "long" })}</span>
        <span className="nc-date">{now.toLocaleDateString([], { month: "long", day: "numeric" })}</span>
      </div>
      <div className="nc-head">
        <span>Notifications</span>
        {visible.length > 0 && (
          <button className="nc-clear" onClick={() => save(all.map((n) => n.id))}>
            Clear all
          </button>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="nc-empty">
          <Bell size={16} /> You&rsquo;re all caught up.
          <button className="nc-clear" onClick={() => save([])}>
            Restore
          </button>
        </p>
      ) : (
        <ul className="nc-list">
          <AnimatePresence initial={false}>
            {visible.map((n) => (
              <motion.li key={n.id} layout exit={{ opacity: 0, x: 30 }} className="nc-item">
                <button
                  className="nc-main"
                  onClick={() => {
                    if (n.target) os.open(n.target, { source: "notification" });
                    os.setCenterOpen(false);
                  }}
                >
                  <span className="nc-icon">
                    <n.icon size={15} />
                  </span>
                  <span className="nc-text">
                    <strong>{n.title}</strong>
                    <span>{n.body}</span>
                  </span>
                  {n.date && <time className="nc-time">{formatDate(n.date)}</time>}
                </button>
                <button className="nc-x" aria-label={`Dismiss ${n.title}`} onClick={() => save([...dismissed, n.id])}>
                  <X size={12} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.aside>
  );
}

export function Toasts() {
  const os = useOS();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {os.toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast surface-glass"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
            onClick={() => os.dismissToast(t.id)}
          >
            <Mark size={18} />
            <span>
              <strong>{t.title}</strong>
              {t.body && <span>{t.body}</span>}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** A short, skippable start-up: once per browser session, never with reduced motion. */
export function Boot({ onDone }: { onDone: () => void }) {
  const { reducedMotion } = useSettings();
  useEffect(() => {
    if (reducedMotion) return onDone();
    const t = window.setTimeout(onDone, 1250);
    const skip = () => onDone();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone, reducedMotion]);
  return (
    <motion.div className="boot" exit={{ opacity: 0, transition: { duration: 0.35 } }} aria-label="Starting iratanshOS" role="status">
      <motion.div className="boot-mark" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Mark size={48} blink />
      </motion.div>
      <div className="boot-bar">
        <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.05, ease: [0.4, 0, 0.2, 1] }} />
      </div>
      <span className="boot-name">iratanshOS</span>
    </motion.div>
  );
}
