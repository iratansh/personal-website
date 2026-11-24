import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Metric } from "../../../data/types";

export function Ext({ href, children, className = "doc-link" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children} <ArrowUpRight size={12} />
    </a>
  );
}

export function DocHeader({ kicker, title, dek, meta }: { kicker: ReactNode; title: ReactNode; dek?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="doc-head">
      <div className="doc-kicker">{kicker}</div>
      <h1 className="doc-title">{title}</h1>
      {dek && <p className="doc-dek">{dek}</p>}
      {meta && <div className="doc-meta">{meta}</div>}
    </header>
  );
}

export function Section({ id, n, title, children }: { id: string; n?: string; title: string; children: ReactNode }) {
  return (
    <section className="doc-sec" id={id} aria-labelledby={`${id}-h`}>
      <h2 className="doc-h2" id={`${id}-h`}>
        {n && <span className="doc-n">{n}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="chips">
      {items.map((s) => (
        <li key={s} className="chip">
          {s}
        </li>
      ))}
    </ul>
  );
}

export function Metrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="metrics">
      <dl className="metric-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric">
            <dt className="metric-l">{m.label}</dt>
            <dd className="metric-v">{m.value}</dd>
            {m.context && <dd className="metric-c">{m.context}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Jump links to the sections of a long document. */
export function Toc({ items, scroller }: { items: { id: string; label: string }[]; scroller: () => HTMLElement | null }) {
  return (
    <nav className="doc-toc" aria-label="Sections">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => {
            const root = scroller();
            const el = root?.querySelector<HTMLElement>(`#${CSS.escape(it.id)}`);
            if (root && el) root.scrollTo({ top: el.offsetTop - 56, behavior: "smooth" });
          }}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}
