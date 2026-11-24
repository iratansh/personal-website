import { useMemo } from "react";
import { CircleCheck, CircleDot, GitMerge, GitPullRequest } from "lucide-react";
import { profile, verifiedOutputs } from "../../../data/profile";
import { experience, skills } from "../../../data/experience";
import { domains } from "../../../data/domains";
import { projects, projectById } from "../../../data/projects";
import { lab } from "../../../data/lab";
import { contributions, STATUS_LABEL, type Contribution } from "../../../data/opensource";
import type { Note, NoteBlock } from "../../../data/types";
import { formatDate, MOD } from "../../hooks";
import { useOS } from "../../store";
import { Chips, DocHeader, Ext, Section } from "./parts";
import { ProjectBody } from "./ProjectDoc";

function OpenLink({ target, children }: { target: string; children: React.ReactNode }) {
  const os = useOS();
  return (
    <button className="doc-inlink" onClick={() => os.open(target)}>
      {children}
    </button>
  );
}

const range = (s: string, e: string) => `${formatDate(s)} – ${formatDate(e)}`;

/* ---- About Me.txt ---- */
const PRINCIPLES: { title: string; body: string; target: string; from: string }[] = [
  {
    title: "Reject, don't buffer.",
    body: "Overload should reach the sender as an explicit answer, not hide in a queue that grows until something falls over.",
    target: "note:reject-dont-buffer",
    from: "Telemetry Collector",
  },
  {
    title: "Degrade, don't fail.",
    body: "Every external dependency gets a timeout and a fallback, so a slow model or a missing service costs quality, not the whole session.",
    target: "project:evaluate",
    from: "Evaluate",
  },
  {
    title: "Locks never span network I/O.",
    body: "Decide what you need from the outside world first, then lock, write, and leave.",
    target: "note:locks-and-network-io",
    from: "PaperTrade",
  },
  {
    title: "Measure what recovery actually costs.",
    body: "A durability claim isn't real until a benchmark kills the process and times the replay.",
    target: "note:wal-recovery",
    from: "Telemetry Collector",
  },
];

export function AboutDoc() {
  return (
    <article className="doc doc-txt">
      <DocHeader
        kicker="About Me.txt"
        title={profile.name}
        dek={profile.role}
        meta={
          <>
            <span>
              {profile.education.degree}, {profile.education.school} · expected {profile.education.expected}
            </span>
            <span>{profile.education.location}</span>
          </>
        }
      />
      <Section id="summary" title="Summary">
        <p className="doc-p">{profile.intro}</p>
      </Section>
      <Section id="interests" title="What I work on">
        <dl className="doc-defs">
          {domains.map((d) => (
            <div key={d.id}>
              <dt>{d.label}</dt>
              <dd>{d.description}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="principles" title="How I like to build">
        <p className="doc-p doc-muted">A few rules I keep arriving at, each one learned on a specific project.</p>
        <ol className="principles">
          {PRINCIPLES.map((p) => (
            <li key={p.title}>
              <h3>{p.title}</h3>
              <p>
                {p.body} <OpenLink target={p.target}>From {p.from} →</OpenLink>
              </p>
            </li>
          ))}
        </ol>
      </Section>
      <Section id="experience" title="Experience">
        <ul className="doc-roles">
          {experience.map((r) => (
            <li key={r.id}>
              <div className="doc-role-when">{range(r.start, r.end)}</div>
              <div>
                <strong>{r.company}</strong>
                <span>
                  {r.role}
                  {r.team ? ` · ${r.team}` : ""}
                </span>
                <p>{r.summary}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="doc-p">
          <OpenLink target="experience">Full details in Experience.md →</OpenLink>
        </p>
      </Section>
      <Section id="elsewhere" title="Elsewhere">
        <p className="doc-p doc-links-row">
          <Ext href={profile.links.github}>GitHub</Ext>
          <Ext href={profile.links.linkedin}>LinkedIn</Ext>
          <a className="doc-link" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </p>
      </Section>
    </article>
  );
}

/* ---- Technical Skills.txt ---- */
const CATEGORIES: { title: string; items: string[] }[] = [
  { title: "Programming Languages", items: skills.Languages },
  {
    title: "Infrastructure and Cloud",
    items: (skills["Cloud & Infrastructure"] ?? []).filter((s) => !["GitHub Actions", "Linux"].includes(s)),
  },
  {
    title: "Backend and Distributed Systems",
    items: [...(skills["Backend & Full-Stack"] ?? []), "Kafka", "Flink", "PySpark", "Databricks"],
  },
  { title: "Databases", items: ["PostgreSQL", "Redis", "MSSQL", "MySQL", "TimescaleDB", "InfluxDB"] },
  { title: "Observability", items: ["OpenTelemetry", "Prometheus", "Grafana", "Loki", "ELK Stack"] },
  { title: "AI and Developer Tooling", items: skills["Applied & Agentic AI"] ?? [] },
  { title: "Development Tools", items: ["GitHub Actions", "Azure DevOps", "Docker Compose", "Flyway", "Linux"] },
];

/**
 * What counts as evidence for each skill, matched as whole words against project stacks and
 * languages, role stacks and résumé bullets, lab repos, and this site. A skill with no entry
 * matches its own name.
 */
const EVIDENCE: Record<string, string[]> = {
  Python: ["python", "pyspark", "fastapi", "flask", "fastmcp", "pydantic", "ros 2", "mujoco", "pybullet", "gym"],
  Java: ["java", "spring boot", "spring webflux", "r2dbc", "flink"],
  Go: ["go", "gin"],
  TypeScript: ["typescript"],
  JavaScript: ["javascript", "node.js", "react", "next.js", "sveltekit"],
  SQL: ["postgresql", "postgres", "mssql", "mysql", "timescaledb", "sqlite", "r2dbc", "spring data jpa", "ssis", "flyway", "rds"],
  "Spring Boot": ["spring boot"],
  "Spring WebFlux": ["spring webflux", "webflux"],
  "Node.js": ["node.js"],
  React: ["react"],
  "GCP (GKE)": ["gcp", "gke"],
  Kubernetes: ["kubernetes", "gke", "helm"],
  "AWS (ALB, EC2, ECS, S3, RDS, SQS, ElastiCache)": ["aws", "ecs", "fargate", "ec2", "elasticache", "rds", "sqs", "ecr", "alb", "cloudwatch"],
  Azure: ["azure"],
  Docker: ["docker", "docker compose"],
  Linux: ["linux", "namespaces", "cgroups", "ros 2", "openshift", "kubernetes"],
  Redis: ["redis", "elasticache"],
  MSSQL: ["mssql", "ssis"],
  Kafka: ["kafka"],
  OpenTelemetry: ["opentelemetry", "otlp"],
  "ELK Stack": ["elasticsearch", "logstash", "kibana", "elk", "elastic ml"],
  MCP: ["mcp", "fastmcp"],
  "Reinforcement learning (PPO)": ["reinforcement learning", "ppo"],
  "Vision-language models": ["vlm", "vision-language"],
  "GitHub Actions": ["github actions"],
  "Azure DevOps": ["azure devops"],
};

/** Everyday tools used throughout my work, so a per-project list would just repeat every project. */
const ACROSS_PROJECTS = new Set(["Claude Code", "GitHub Copilot", "Cursor"]);

/** Where each skill shows up in real work: projects, roles, lab repos, and this site. */
function useUsage() {
  return useMemo(() => {
    const sources: { name: string; tags: string[] }[] = [
      ...projects.map((p) => ({ name: p.name, tags: [...p.stack, ...p.language.split(" · ")] })),
      ...experience.map((r) => ({ name: r.shortName, tags: [...r.stack, ...r.highlights, r.summary] })),
      ...lab.map((l) => ({ name: l.name, tags: [...l.tags, ...(l.language ?? "").split(" · ")] })),
      { name: "This site", tags: ["React", "TypeScript", "Vite", "GitHub Actions"] },
    ];
    const esc = (a: string) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return (skill: string) => {
      const words = EVIDENCE[skill] ?? [skill.replace(/\s*\(.*\)$/, "").toLowerCase()];
      const res = words.map((w) => new RegExp(`(^|[^a-z0-9])${esc(w)}([^a-z0-9]|$)`, "i"));
      return sources.filter((s) => s.tags.some((t) => res.some((r) => r.test(t)))).map((s) => s.name);
    };
  }, []);
}

export function SkillsDoc() {
  const usedIn = useUsage();
  return (
    <article className="doc doc-txt">
      <DocHeader
        kicker="Technical Skills.txt"
        title="Technical skills"
        dek="Grouped by area. No ratings: next to each one is where I've actually used it."
      />
      {CATEGORIES.map((c, i) => (
        <Section key={c.title} id={`cat-${i}`} title={c.title}>
          <ul className="skills">
            {c.items.map((s) => {
              const where = ACROSS_PROJECTS.has(s) ? ["Across my projects"] : usedIn(s);
              return (
                <li key={s}>
                  <span className="skill">{s}</span>
                  <span className="skill-where">
                    {where.length ? where.slice(0, 4).join(" · ") + (where.length > 4 ? ` +${where.length - 4}` : "") : "On my résumé"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
    </article>
  );
}

/* ---- Experience.md ---- */
export function ExperienceDoc() {
  return (
    <article className="doc">
      <DocHeader kicker="Experience.md" title="Experience" dek="Production work, most recent first." />
      <div className="outputs">
        {verifiedOutputs.map((o) => (
          <div key={o.label} className="output">
            <span className="output-v">{o.value}</span>
            <span className="output-l">{o.label}</span>
            <span className="output-s">{o.source}</span>
          </div>
        ))}
      </div>
      {experience.map((r) => (
        <Section key={r.id} id={r.id} title={r.company}>
          <div className="role-meta">
            <strong>
              {r.role}
              {r.team ? ` · ${r.team}` : ""}
            </strong>
            <span>
              {range(r.start, r.end)} · {r.location}
            </span>
          </div>
          <p className="doc-p">{r.summary}</p>
          <ul className="doc-bullets">
            {r.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <Chips items={r.stack} />
        </Section>
      ))}
    </article>
  );
}

/* ---- Open Source ---- */
export function OssReadme() {
  const count = (st: string) => contributions.filter((c) => c.status === st).length;
  const active = contributions.filter((c) => c.status !== "merged");
  return (
    <article className="doc doc-txt">
      <DocHeader kicker="Open Source / README.md" title="Open source" dek="Contributions to repositories I don't own, with their real status on GitHub." />
      <Section id="why" title="Why">
        <p className="doc-p">When a tool I use is missing something, the best fix is upstream, where everyone else gets it too.</p>
        {active.length > 0 && (
          <ul className="doc-bullets">
            {active.map((c) => (
              <li key={c.id}>
                <OpenLink target={`oss:${c.id}`}>
                  {c.repo} #{c.number}
                </OpenLink>{" "}
                ({STATUS_LABEL[c.status].toLowerCase()}): {c.title}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="whats-here" title="What's in this folder">
        <ul className="doc-bullets">
          <li>
            {contributions.length} contributions:{" "}
            {(
              [
                ["merged", "merged"],
                ["approved", "approved and awaiting merge"],
                ["open", "open for review"],
                ["in-progress", "in progress"],
              ] as const
            )
              .filter(([st]) => count(st) > 0)
              .map(([st, label]) => `${count(st)} ${label}`)
              .join(", ")}
            .
          </li>
          <li>Each entry links to the pull request, or to the issue while the pull request isn&rsquo;t open yet.</li>
          <li>Nothing is listed as merged unless GitHub says it is.</li>
        </ul>
      </Section>
    </article>
  );
}

function DiffBar({ c }: { c: Contribution }) {
  if (!c.diff) return null;
  const total = c.diff.additions + c.diff.deletions || 1;
  return (
    <div className="diffbar" aria-label={`${c.diff.additions} additions, ${c.diff.deletions} deletions across ${c.diff.files} files`}>
      <div className="diffbar-track">
        <span className="diffbar-add" style={{ width: `${(c.diff.additions / total) * 100}%` }} />
        <span className="diffbar-del" style={{ width: `${(c.diff.deletions / total) * 100}%` }} />
      </div>
      <span className="diffbar-text">
        <b className="add">+{c.diff.additions.toLocaleString()}</b> <b className="del">−{c.diff.deletions.toLocaleString()}</b> · {c.diff.files} file
        {c.diff.files === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function ContributionDoc({ c }: { c: Contribution }) {
  const p = c.projectId ? projectById[c.projectId] : undefined;
  return (
    <div className="doc-scroll">
      <article className="doc">
        <DocHeader
          kicker={
            <span className={`pr-status pr-${c.status}`}>
              {c.status === "merged" ? (
                <GitMerge size={13} />
              ) : c.status === "approved" ? (
                <CircleCheck size={13} />
              ) : c.kind === "issue" ? (
                <CircleDot size={13} />
              ) : (
                <GitPullRequest size={13} />
              )}
              {
                {
                  merged: `Merged ${formatDate(c.date)}`,
                  approved: `Approved · awaiting merge · opened ${formatDate(c.date)}`,
                  open: `Open · under review since ${formatDate(c.date)}`,
                  "in-progress": `In progress · issue assigned to me · pull request not open yet`,
                }[c.status]
              }
            </span>
          }
          title={c.title}
          dek={
            <>
              {c.repo} {c.kind === "issue" ? "issue" : "pull request"} #{c.number} ·{" "}
              {c.relation === "upstream" ? "upstream project" : "team repository"}
            </>
          }
          meta={
            <>
              <Ext href={c.url}>{c.kind === "issue" ? "View issue" : "View pull request"}</Ext>
              <Ext href={c.repoUrl}>{c.repo}</Ext>
              {c.links?.map((l) => (
                <Ext key={l.href} href={l.href}>
                  {l.label}
                </Ext>
              ))}
            </>
          }
        />
        <Section id="summary" title="Summary">
          <p className="doc-p">{c.summary}</p>
          <DiffBar c={c} />
          <Chips items={c.tech} />
        </Section>
        {c.example && (
          <Section id="example" title="What it does">
            <pre className="doc-code">
              <span className="doc-code-lang">{c.example.lang}</span>
              <code>{c.example.code}</code>
            </pre>
            {c.example.caption && <p className="doc-note">{c.example.caption}</p>}
          </Section>
        )}
        {p && (
          <>
            <hr className="doc-rule" />
            <p className="doc-kicker">Write-up</p>
            <ProjectBody p={p} />
          </>
        )}
      </article>
    </div>
  );
}

/* ---- Notes ---- */
function Block({ b }: { b: NoteBlock }) {
  switch (b.type) {
    case "p":
      return <p className="doc-p">{b.text}</p>;
    case "h":
      return <h3 className="doc-h3">{b.text}</h3>;
    case "list":
      return (
        <ul className="doc-bullets">
          {b.items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="doc-code">
          {b.lang && <span className="doc-code-lang">{b.lang}</span>}
          <code>{b.text}</code>
        </pre>
      );
    case "callout":
      return <aside className="doc-callout">{b.text}</aside>;
  }
}

export function NoteDoc({ note }: { note: Note }) {
  const p = note.projectId ? projectById[note.projectId] : undefined;
  const target = p ? (p.kind === "upstream" ? `oss:${contributions.find((c) => c.projectId === p.id)?.id}` : `project:${p.id}`) : undefined;
  return (
    <article className="doc doc-note-doc">
      <DocHeader
        kicker={
          <>
            Note · {formatDate(note.date)}
            {p ? ` · ${p.name}` : ""}
          </>
        }
        title={note.title}
        dek={note.dek}
        meta={<Chips items={note.tags.map((t) => `#${t}`)} />}
      />
      <div className="doc-prose">
        {note.blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}
      </div>
      <footer className="doc-foot">
        {p && target && <OpenLink target={target}>Open the {p.name} write-up →</OpenLink>}
        {note.source && <Ext href={note.source.href}>Source: {note.source.label}</Ext>}
      </footer>
    </article>
  );
}

/* ---- Keyboard Shortcuts.md ---- */
const SHORTCUTS: [string, string][] = [
  [`${MOD} K  or  ${MOD} Space`, "Search apps, projects, and documents"],
  ["`", "Open Terminal"],
  [`${MOD} ,`, "Settings"],
  ["⌥ W", "Close the focused window"],
  ["⌥ M", "Minimize the focused window"],
  ["⌥ F", "Maximize or restore the focused window"],
  ["⌥ ← / ⌥ →", "Tile the focused window left or right"],
  ["⌥ `", "Cycle through windows"],
  ["Esc", "Close menus and the launcher"],
];
const GESTURES: [string, string][] = [
  ["Click", "Select an icon"],
  ["Double-click", "Open it"],
  ["Right-click", "Context menu (desktop, icons, files, dock)"],
  ["Drag an icon", "Rearrange the desktop (positions are remembered)"],
  ["Drag a title bar", "Move a window. Drag to the top edge to maximize, or to the left or right edge to tile"],
  ["Double-click a title bar", "Maximize or restore"],
  ["Click a running dock icon", "Focus it; click again to minimize; click a minimized one to restore"],
  ["Arrow keys + Enter", "Move through icons and files, and open them"],
];

export function HelpDoc() {
  return (
    <article className="doc doc-txt">
      <DocHeader kicker="System / Keyboard Shortcuts.md" title="Keyboard shortcuts" dek="Window shortcuts use ⌥ (Alt) because browsers keep ⌘W and ⌘M for themselves." />
      <Section id="keys" title="Keys">
        <dl className="kv">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="gestures" title="Mouse and trackpad">
        <dl className="kv">
          {GESTURES.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="more" title="More">
        <p className="doc-p">
          The Terminal understands <code>help</code>, <code>open</code>, <code>ls</code>, and <code>cd</code>. A few commands aren&rsquo;t listed
          there. Neither is everything the keyboard can do on the desktop.
        </p>
      </Section>
    </article>
  );
}
