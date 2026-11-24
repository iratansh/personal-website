import { useRef } from "react";
import { FaGithub } from "react-icons/fa6";
import { ArchitectureDiagram } from "../../../components/viz/ArchitectureDiagram";
import { domainById } from "../../../data/domains";
import { notes } from "../../../data/knowledge";
import { lastCommit } from "../../../data/repoActivity";
import { formatDate } from "../../hooks";
import type { Project } from "../../../data/types";
import { useOS } from "../../store";
import { Chips, DocHeader, Ext, Metrics, Section, Toc } from "./parts";

const KIND: Record<string, string> = {
  service: "Service",
  platform: "Platform",
  pipeline: "Pipeline",
  upstream: "Upstream contribution",
  runtime: "Runtime",
  application: "Application",
};

/** The body of a project write-up, shared by project documents and contribution documents. */
export function ProjectBody({ p, start = 1 }: { p: Project; start?: number }) {
  const os = useOS();
  const related = notes.filter((n) => n.projectId === p.id);
  let n = start - 1;
  const num = () => String(++n).padStart(2, "0");
  return (
    <>
      <Section id="overview" n={num()} title="Overview">
        <p className="doc-p">{p.overview}</p>
      </Section>
      <Section id="problem" n={num()} title="The problem">
        <blockquote className="doc-callout">{p.problem}</blockquote>
      </Section>
      <Section id="architecture" n={num()} title="Architecture">
        <figure className="doc-figure">
          <ArchitectureDiagram nodes={p.architecture.nodes} edges={p.architecture.edges} />
          <figcaption>{p.architecture.caption} Hover a component to trace its connections.</figcaption>
        </figure>
      </Section>
      <Section id="stack" n={num()} title="Technology stack">
        <Chips items={p.stack} />
      </Section>
      <Section id="decisions" n={num()} title="Key decisions">
        <ol className="decisions">
          {p.decisions.map((d, i) => (
            <li key={d.title}>
              <span className="decision-n">{String.fromCharCode(65 + i)}</span>
              <div>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section id="metrics" n={num()} title="Benchmarks">
        {p.metrics.length ? <Metrics metrics={p.metrics} /> : <p className="doc-note">{p.metricsNote ?? "No published benchmarks."}</p>}
      </Section>
      {related.length > 0 && (
        <Section id="notes" n={num()} title="Related notes">
          <ul className="doc-related">
            {related.map((r) => (
              <li key={r.id}>
                <button onClick={() => os.open(`note:${r.id}`)}>
                  <strong>{r.title}</strong>
                  <span>{r.dek}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

export function ProjectDoc({ p }: { p: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const toc = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "stack", label: "Stack" },
    { id: "decisions", label: "Decisions" },
    { id: "metrics", label: "Benchmarks" },
  ];
  return (
    <div className="doc-scroll" ref={ref}>
      <div className="doc-bar">
        <Toc items={toc} scroller={() => ref.current} />
        {p.repo && (
          <a className="btn btn-sm" href={p.repo} target="_blank" rel="noreferrer">
            <FaGithub /> Repository
          </a>
        )}
      </div>
      <article className="doc">
        <DocHeader
          kicker={
            <>
              {KIND[p.kind] ?? p.kind} · {p.language}
            </>
          }
          title={p.name}
          dek={p.tagline}
          meta={
            <>
              <span>{p.domains.map((d) => domainById[d]?.label).filter(Boolean).join(" · ")}</span>
              {p.repo && lastCommit[p.repo] && <span>Last commit {formatDate(lastCommit[p.repo])}</span>}
              {p.repo && <Ext href={p.repo}>{p.repo.replace("https://github.com/", "github.com/")}</Ext>}
              {p.links?.map((l) => (
                <Ext key={l.href} href={l.href}>
                  {l.label}
                </Ext>
              ))}
            </>
          }
        />
        <ProjectBody p={p} />
      </article>
    </div>
  );
}
