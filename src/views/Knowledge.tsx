import { AnimatePresence, motion } from "framer-motion";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { noteById, notes } from "../data/knowledge";
import { projectById } from "../data/projects";
import { formatMonth } from "../lib/hooks";
import type { Note, NoteBlock } from "../data/types";
import { Icon } from "../components/ui/Icon";
import { ViewHeader } from "../components/ui/Primitives";

/** The system a note was written about: more useful in the index than a category every note shares. */
function about(n: Note) {
  return n.projectId ? projectById[n.projectId]?.name : undefined;
}

function Block({ b }: { b: NoteBlock }) {
  switch (b.type) {
    case "p":
      return <p>{b.text}</p>;
    case "h":
      return <h3>{b.text}</h3>;
    case "list":
      return (
        <ul>
          {b.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="kb-code">
          {b.lang && <span className="label">{b.lang}</span>}
          <code>{b.text}</code>
        </pre>
      );
    case "callout":
      return <aside className="kb-callout">{b.text}</aside>;
  }
}

export default function Knowledge() {
  const { route } = useNexus();
  const current = route.param ? noteById[route.param] : notes[0];

  return (
    <div className="view knowledge">
      <ViewHeader
        index="05"
        kicker="Knowledge Base"
        title="Notes from the engine room."
        lede="Architecture breakdowns and engineering notes — the reasoning behind the systems in the registry."
      />

      <div className={`kb ${route.param ? "has-open" : ""}`}>
        <nav className="kb-index" aria-label="Notes">
          <div className="label kb-index-head">
            <span>Index</span>
            <span className="dim">{notes.length} entries</span>
          </div>
          <ol>
            {notes.map((n, i) => (
              <li key={n.id}>
                <a
                  href={toHref({ module: "knowledge", param: n.id })}
                  aria-current={current?.id === n.id ? "page" : undefined}
                >
                  <span className="mono kb-num">{String(i + 1).padStart(3, "0")}</span>
                  <span className="kb-item-title">{n.title}</span>
                  {about(n) && <span className="kb-item-meta label">{about(n)}</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <AnimatePresence mode="wait">
          {current ? (
            <motion.article
              key={current.id}
              className="kb-reader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {route.param && (
                <a href={toHref({ module: "knowledge" })} className="link-arrow kb-back">
                  <Icon name="arrowLeft" /> all notes
                </a>
              )}
              <div className="label kb-meta">
                {about(current) && <span className="accent">{about(current)}</span>}
                {about(current) && " · "}
                {formatMonth(current.date)}
              </div>
              <h2 className="kb-title">{current.title}</h2>
              <p className="kb-dek">{current.dek}</p>
              <div className="kb-tags">
                {current.tags.map((t) => (
                  <span key={t} className="chip">
                    #{t}
                  </span>
                ))}
              </div>
              <div className="kb-prose">
                {current.blocks.map((b, i) => (
                  <Block key={i} b={b} />
                ))}
              </div>
              <footer className="kb-foot">
                {current.projectId && projectById[current.projectId] && (
                  <a className="btn" href={toHref({ module: "registry", param: current.projectId })}>
                    Open {projectById[current.projectId].name} in registry <Icon name="arrowRight" />
                  </a>
                )}
                {current.source && (
                  <a className="link-arrow" href={current.source.href} target="_blank" rel="noreferrer">
                    Source: {current.source.label} <Icon name="arrowUpRight" />
                  </a>
                )}
              </footer>
            </motion.article>
          ) : (
            <p className="mono dim">Note not found.</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
