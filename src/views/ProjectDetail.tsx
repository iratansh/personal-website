import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa6";
import { toHref } from "../lib/routes";
import { projectById, projects } from "../data/projects";
import { notes } from "../data/knowledge";
import { Icon } from "../components/ui/Icon";
import { Reveal, SectionHead } from "../components/ui/Primitives";
import { domainById } from "../data/domains";
import { ArchitectureDiagram } from "../components/viz/ArchitectureDiagram";
import NotFound from "./NotFound";
import { track } from "../analytics";

const SECTIONS = [
  ["overview", "Overview"],
  ["problem", "Problem"],
  ["architecture", "Architecture"],
  ["stack", "Stack"],
  ["challenges", "Challenges"],
  ["decisions", "Decisions"],
  ["metrics", "Metrics"],
] as const;

export default function ProjectDetail({ id }: { id: string }) {
  const p = projectById[id];
  const [activeSec, setActiveSec] = useState("overview");

  useEffect(() => {
    const root = document.getElementById("main");
    const els = SECTIONS.map(([sid]) => document.getElementById(`sec-${sid}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActiveSec(vis[0].target.id.replace("sec-", ""));
      },
      { root, rootMargin: "-20% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [id]);

  if (!p) return <NotFound what={`service "${id}"`} />;
  const idx = projects.indexOf(p);
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const related = notes.filter((n) => n.projectId === p.id);

  const jump = (sid: string) => {
    track("project_section", { project: p.id, section: sid });
    jumpTo(sid);
  };
  const jumpTo = (sid: string) => document.getElementById(`sec-${sid}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="view detail">
      <a href={toHref({ module: "registry" })} className="link-arrow detail-back">
        <Icon name="arrowLeft" /> registry
      </a>

      <header className="detail-head">
        <div className="label">
          <span className="accent">svc-{String(idx + 1).padStart(2, "0")}</span> <span className="dim">/</span>{" "}
          {p.kind === "upstream" ? "upstream contribution" : p.kind}
        </div>
        <h1 className="detail-title">{p.name}</h1>
        <p className="detail-tagline">{p.tagline}</p>
        <div className="detail-meta">
          <div>
            <span className="label">Runtime</span>
            <span className="mono">{p.language}</span>
          </div>
          <div>
            <span className="label">Domains</span>
            <span>{p.domains.map((d) => domainById[d].label).join(" · ")}</span>
          </div>
          <div className="detail-links">
            {p.repo && (
              <a className="btn" href={p.repo} target="_blank" rel="noreferrer">
                <FaGithub /> Repository <Icon name="arrowUpRight" />
              </a>
            )}
            {p.links?.map((l) => (
              <a key={l.href} className="btn btn-ghost" href={l.href} target="_blank" rel="noreferrer">
                {l.label} <Icon name="arrowUpRight" />
              </a>
            ))}
          </div>
        </div>
      </header>

      <div className="detail-body">
        <nav className="detail-toc" aria-label="Sections">
          <span className="label">Contents</span>
          <ul>
            {SECTIONS.map(([sid, label], i) => (
              <li key={sid}>
                <button onClick={() => jump(sid)} aria-current={activeSec === sid ? "true" : undefined}>
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span> {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="detail-content">
          <section id="sec-overview" className="detail-sec">
            <SectionHead index="01" title="Overview" />
            <p className="detail-lead">{p.overview}</p>
          </section>

          <section id="sec-problem" className="detail-sec">
            <SectionHead index="02" title="Problem" />
            <blockquote className="detail-problem">{p.problem}</blockquote>
          </section>

          <section id="sec-architecture" className="detail-sec">
            <SectionHead index="03" title="Architecture" />
            <Reveal>
              <div className="frame detail-arch">
                <ArchitectureDiagram nodes={p.architecture.nodes} edges={p.architecture.edges} />
              </div>
              <p className="detail-caption mono">↳ {p.architecture.caption}</p>
            </Reveal>
          </section>

          <section id="sec-stack" className="detail-sec">
            <SectionHead index="04" title="Technology stack" />
            <ul className="stack-list">
              {p.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section id="sec-challenges" className="detail-sec">
            <SectionHead index="05" title="Engineering challenges" />
            <ol className="challenge-list">
              {p.challenges.map((c, i) => (
                <Reveal as="li" key={i} delay={i * 0.05}>
                  <span className="mono accent">{String.fromCharCode(65 + i)}</span>
                  <p>{c}</p>
                </Reveal>
              ))}
            </ol>
          </section>

          <section id="sec-decisions" className="detail-sec">
            <SectionHead index="06" title="Key implementation decisions" />
            <div className="decision-list">
              {p.decisions.map((d, i) => (
                <Reveal key={d.title} className="decision" delay={i * 0.05}>
                  <span className="label">ADR-{String(i + 1).padStart(3, "0")}</span>
                  <h3>{d.title}</h3>
                  <p>{d.body}</p>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="sec-metrics" className="detail-sec">
            <SectionHead index="07" title="Measured results" />
            {p.metrics.length ? (
              <div className="metric-grid">
                {p.metrics.map((m) => (
                  <div key={m.label} className="metric frame">
                    <span className="metric-value mono">{m.value}</span>
                    <span className="metric-label">{m.label}</span>
                    {m.context && <span className="metric-ctx">{m.context}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="metric-none mono">
                <span className="dim">∅</span> {p.metricsNote}
              </p>
            )}
          </section>

          {related.length > 0 && (
            <section className="detail-sec">
              <SectionHead title="Related notes" />
              <ul className="related">
                {related.map((n) => (
                  <li key={n.id}>
                    <a href={toHref({ module: "knowledge", param: n.id })}>
                      <span className="label">kb</span>
                      <strong>{n.title}</strong>
                      <Icon name="arrowRight" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="detail-pager" aria-label="More services">
            <a href={toHref({ module: "registry", param: prev.id })}>
              <span className="label">← Previous</span>
              <strong>{prev.name}</strong>
            </a>
            <a href={toHref({ module: "registry", param: next.id })} className="right">
              <span className="label">Next →</span>
              <strong>{next.name}</strong>
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
