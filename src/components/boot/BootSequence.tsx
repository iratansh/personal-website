import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { projects } from "../../data/projects";
import { experience } from "../../data/experience";
import { notes } from "../../data/knowledge";
import { lab } from "../../data/lab";
import { profile } from "../../data/profile";
import { Wordmark } from "../shell/TopBar";

const LINES = [
  ["kernel", "iratansh 1.0: cold start"],
  ["mount", `/registry ${".".repeat(10)} ${projects.length} services`],
  ["mount", `/experience ${".".repeat(8)} ${experience.length} roles`],
  ["mount", `/lab ${".".repeat(15)} ${lab.length} experiments`],
  ["mount", `/kb ${".".repeat(16)} ${notes.length} notes`],
  ["link", "backpressure ....... ok"],
  ["auth", `operator ${profile.name}`],
] as const;

const STEP = 115;

/** A short, skippable initialisation sequence. Shown once per browser session. */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    LINES.forEach((_, i) => timers.push(window.setTimeout(() => setShown(i + 1), 120 + i * STEP)));
    timers.push(window.setTimeout(() => setLeaving(true), 120 + LINES.length * STEP + 380));
    const skip = () => setLeaving(true);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(onDone, 520);
    return () => clearTimeout(id);
  }, [leaving, onDone]);

  const progress = shown / LINES.length;

  return (
    <motion.div
      className="boot"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={leaving ? { opacity: 0, filter: "blur(6px)" } : { opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="boot-inner">
        <motion.div
          className="boot-mark"
          initial={{ opacity: 0, letterSpacing: "0.9em" }}
          animate={{ opacity: 1, letterSpacing: "0.42em" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Wordmark />
        </motion.div>
        <div className="boot-log mono">
          {LINES.slice(0, shown).map(([tag, text], i) => (
            <div key={i} className="boot-line">
              <span className="boot-t">[{(i * 0.0413).toFixed(4)}]</span>
              <span className="boot-tag">{tag}</span>
              <span>{text}</span>
              <span className="boot-ok">ok</span>
            </div>
          ))}
        </div>
        <div className="boot-bar">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="boot-skip label">press any key to skip</div>
      </div>
    </motion.div>
  );
}
