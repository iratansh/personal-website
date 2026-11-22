import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { useNexus } from "../../lib/nexus";
import { modules, type Route } from "../../lib/routes";
import { projects } from "../../data/projects";
import { experience } from "../../data/experience";
import { notes } from "../../data/knowledge";
import { lab } from "../../data/lab";
import { profile } from "../../data/profile";
import { Icon, moduleIcon } from "../ui/Icon";
import { track } from "../../analytics";

interface Item {
  id: string;
  group: "Modules" | "Projects" | "Experience" | "Knowledge" | "Lab" | "Actions";
  title: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

/** Subsequence fuzzy score: contiguous and word-start matches score higher. */
function score(query: string, text: string) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const idx = t.indexOf(q);
  if (idx !== -1) return 100 - idx + (idx === 0 || t[idx - 1] === " " ? 20 : 0);
  let ti = 0;
  let s = 0;
  let streak = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    streak = found === ti ? streak + 1 : 0;
    s += 1 + streak * 2 + (found === 0 || t[found - 1] === " " ? 3 : 0);
    ti = found + 1;
  }
  return s;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, navigate, setTerminalOpen, cycleMotion, toast } = useNexus();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const items = useMemo<Item[]>(() => {
    const go = (r: Route) => () => navigate(r);
    return [
      ...modules.map((m) => ({
        id: `m:${m.id}`,
        group: "Modules" as const,
        title: m.label,
        hint: m.blurb,
        icon: <Icon name={moduleIcon[m.id]} />,
        keywords: m.path,
        run: go({ module: m.id }),
      })),
      ...projects.map((p) => ({
        id: `p:${p.id}`,
        group: "Projects" as const,
        title: p.name,
        hint: p.tagline,
        icon: <Icon name="registry" />,
        keywords: p.stack.join(" ") + " " + p.language,
        run: go({ module: "registry", param: p.id }),
      })),
      ...experience.map((r) => ({
        id: `r:${r.id}`,
        group: "Experience" as const,
        title: `${r.company}`,
        hint: r.role,
        icon: <Icon name="experience" />,
        keywords: r.stack.join(" ") + " " + r.shortName,
        run: go({ module: "experience", param: r.id }),
      })),
      ...notes.map((n) => ({
        id: `n:${n.id}`,
        group: "Knowledge" as const,
        title: n.title,
        hint: n.dek,
        icon: <Icon name="knowledge" />,
        keywords: n.tags.join(" "),
        run: go({ module: "knowledge", param: n.id }),
      })),
      ...lab.map((l) => ({
        id: `l:${l.id}`,
        group: "Lab" as const,
        title: l.name,
        hint: l.description,
        icon: <Icon name="lab" />,
        keywords: l.tags.join(" "),
        run: go({ module: "lab", param: l.id }),
      })),
      {
        id: "a:terminal",
        group: "Actions",
        title: "Open terminal",
        hint: "Interactive shell · `",
        icon: <Icon name="terminal" />,
        run: () => setTerminalOpen(true),
      },
      {
        id: "a:copy",
        group: "Actions",
        title: "Copy email address",
        hint: profile.email,
        icon: <Icon name="copy" />,
        run: () =>
          (track("contact_copy_email", { source: "palette" }), navigator.clipboard)
            .writeText(profile.email)
            .then(() => toast("Email address copied"))
            .catch(() => toast(profile.email, "warn")),
      },
      {
        id: "a:resume",
        group: "Actions",
        title: "Open résumé",
        hint: "PDF",
        icon: <Icon name="file" />,
        run: () => {
          track("resume_download", { source: "palette" });
          window.open(profile.resume, "_blank", "noopener");
        },
      },
      {
        id: "a:github",
        group: "Actions",
        title: "GitHub",
        hint: `github.com/${profile.handle}`,
        icon: <FaGithub />,
        run: () => {
          track("outbound_github", { target: "profile", source: "palette" });
          window.open(profile.links.github, "_blank", "noopener");
        },
      },
      {
        id: "a:linkedin",
        group: "Actions",
        title: "LinkedIn",
        hint: "in/ishaan-ratanshi",
        icon: <FaLinkedinIn />,
        run: () => {
          track("outbound_linkedin", { source: "palette" });
          window.open(profile.links.linkedin, "_blank", "noopener");
        },
      },
      {
        id: "a:motion",
        group: "Actions",
        title: "Toggle animations",
        hint: "Reduce or restore motion",
        icon: <Icon name="motion" />,
        run: cycleMotion,
      },
    ];
  }, [navigate, setTerminalOpen, cycleMotion, toast]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const scored = items
      .map((it) => {
        const meta = `${it.hint ?? ""} ${it.keywords ?? ""}`.toLowerCase();
        // Titles match fuzzily; descriptions and keywords only on a contiguous substring.
        const s = Math.max(score(needle, it.title) * 2, needle && meta.includes(needle) ? 40 : 0);
        return { it, s };
      })
      .filter((x) => x.s > 0);
    if (!needle) return scored.map((x) => x.it);
    // Keep groups together, ordered by each group's best match.
    const best = new Map<string, number>();
    for (const x of scored) best.set(x.it.group, Math.max(best.get(x.it.group) ?? 0, x.s));
    scored.sort((a, b) => best.get(b.it.group)! - best.get(a.it.group)! || b.s - a.s);
    return scored.slice(0, 14).map((x) => x.it);
  }, [items, q]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    if (paletteOpen) {
      track("palette_open");
      restoreFocus.current = document.activeElement as HTMLElement;
      setQ("");
      window.setTimeout(() => inputRef.current?.focus(), 20);
    } else {
      restoreFocus.current?.focus?.();
    }
  }, [paletteOpen]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const choose = (it: Item | undefined) => {
    if (!it) return;
    setPaletteOpen(false);
    track("palette_select", { item: it.id });
    it.run();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setPaletteOpen(false);
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onKey}
          >
            <div className="palette-input">
              <Icon name="search" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Jump to a module, project, note, or action…"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={results[sel] ? `pal-${results[sel].id}` : undefined}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="kbd">esc</span>
            </div>
            <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
              {results.length === 0 && <div className="palette-empty mono">No matches for “{q}”.</div>}
              {results.map((it, i) => {
                const head = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {head && <div className="palette-group label">{head}</div>}
                    <div
                      id={`pal-${it.id}`}
                      role="option"
                      aria-selected={i === sel}
                      data-idx={i}
                      className="palette-item"
                      onMouseMove={() => setSel(i)}
                      onClick={() => choose(it)}
                    >
                      <span className="palette-icon">{it.icon}</span>
                      <span className="palette-title">{it.title}</span>
                      {it.hint && <span className="palette-hint">{it.hint}</span>}
                      <Icon name="arrowRight" className="palette-go" size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="palette-foot label">
              <span>
                <span className="kbd">↑</span>
                <span className="kbd">↓</span> navigate
              </span>
              <span>
                <span className="kbd">↵</span> open
              </span>
              <span className="palette-count">{results.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
