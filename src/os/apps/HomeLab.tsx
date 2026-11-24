import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Boxes, FlaskConical, LayoutDashboard, Network, Server } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { ArchitectureDiagram } from "../../components/viz/ArchitectureDiagram";
import { projects, projectById } from "../../data/projects";
import { lab } from "../../data/lab";
import { experience } from "../../data/experience";
import { contributions } from "../../data/opensource";
import type { Project } from "../../data/types";
import { useOS } from "../store";
import { Loading } from "../ui/Loading";
import type { AppProps } from "../types";
import { track } from "../../analytics";

const Backpressure = lazy(() => import("../../components/viz/Backpressure"));
const Topology = lazy(() => import("../../components/viz/Topology"));

type Tab = "overview" | "collector" | "architecture" | "infrastructure" | "experiments";
const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "collector", label: "Telemetry Collector", icon: Activity },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "infrastructure", label: "Infrastructure", icon: Server },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
];

const COLLECTOR = projectById["telemetry-collector"];
const docTarget = (p: Project) => (p.kind === "upstream" ? `oss:${contributions.find((c) => c.projectId === p.id)?.id}` : `project:${p.id}`);

const TONE_LABEL: Record<string, string> = {
  client: "Client",
  service: "Service",
  store: "Storage",
  queue: "Queue",
  external: "External system",
  observe: "Telemetry",
};

function SimBadge() {
  return <span className="sim-badge">Simulated · runs in your browser · not production data</span>;
}

/* ---- Architecture explorer: click a component to inspect its connections ---- */
function ArchExplorer({ p }: { p: Project }) {
  const [sel, setSel] = useState<string | null>(p.architecture.nodes[0]?.id ?? null);
  useEffect(() => setSel(p.architecture.nodes[0]?.id ?? null), [p]);
  const byId = Object.fromEntries(p.architecture.nodes.map((n) => [n.id, n]));
  const node = sel ? byId[sel] : undefined;
  const inbound = p.architecture.edges.filter((e) => e.to === sel);
  const outbound = p.architecture.edges.filter((e) => e.from === sel);
  return (
    <div className="hl-arch">
      <div className="hl-arch-diagram">
        <ArchitectureDiagram
          nodes={p.architecture.nodes}
          edges={p.architecture.edges}
          selected={sel}
          onSelect={(id) => {
            setSel(id);
            track("topology_select", { node: `${p.id}/${id}` });
          }}
        />
        <p className="hl-caption">{p.architecture.caption}</p>
      </div>
      {node && (
        <aside className="hl-inspector" aria-live="polite">
          <span className="hl-k">{TONE_LABEL[node.tone ?? "service"]}</span>
          <h3>{node.label}</h3>
          {node.sub && <p className="hl-sub">{node.sub}</p>}
          <div className="hl-conn">
            <h4>Receives from</h4>
            {inbound.length ? (
              inbound.map((e) => (
                <button key={e.from} onClick={() => setSel(e.from)}>
                  ← {byId[e.from].label}
                  {e.label && <em>{e.label}</em>}
                </button>
              ))
            ) : (
              <p className="hl-none">Nothing: this is an entry point.</p>
            )}
            <h4>Sends to</h4>
            {outbound.length ? (
              outbound.map((e) => (
                <button key={e.to} onClick={() => setSel(e.to)}>
                  → {byId[e.to].label}
                  {e.label && <em>{e.label}</em>}
                </button>
              ))
            ) : (
              <p className="hl-none">Nothing: this is where data comes to rest.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/** Ordered hops through the architecture, starting from each entry point. */
function flows(p: Project) {
  const { nodes, edges } = p.architecture;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const hasIn = new Set(edges.map((e) => e.to));
  return nodes
    .filter((n) => !hasIn.has(n.id))
    .map((start) => {
      const hops: { label: string; via?: string }[] = [{ label: start.label }];
      const seen = new Set([start.id]);
      let cur = start.id;
      for (;;) {
        const next = edges.find((e) => e.from === cur && !seen.has(e.to));
        if (!next) break;
        hops.push({ label: byId[next.to].label, via: next.label });
        seen.add(next.to);
        cur = next.to;
      }
      return hops;
    })
    .filter((h) => h.length > 1);
}

/* ---- Tabs ---- */
function Overview({ go }: { go: (t: Tab) => void }) {
  const os = useOS();
  const own = projects.filter((p) => p.kind !== "upstream");
  const tech = new Set(projects.flatMap((p) => p.stack)).size;
  return (
    <div className="hl-page">
      <header className="hl-head">
        <h2>Home Lab</h2>
        <p>The infrastructure side of my work: the systems I&rsquo;ve built, how they&rsquo;re wired, where they run, and the experiments around them.</p>
      </header>
      <div className="hl-stats">
        <button onClick={() => os.open("projects")}>
          <b>{own.length}</b>
          <span>systems documented</span>
        </button>
        <button onClick={() => go("architecture")}>
          <b>{projects.length}</b>
          <span>architectures to explore</span>
        </button>
        <button onClick={() => go("experiments")}>
          <b>{lab.length}</b>
          <span>experiments &amp; research repos</span>
        </button>
        <button onClick={() => go("infrastructure")}>
          <b>{tech}</b>
          <span>technologies across these systems</span>
        </button>
      </div>
      <div className="hl-feature">
        <div>
          <span className="hl-k">Featured</span>
          <h3>{COLLECTOR.name}</h3>
          <p>{COLLECTOR.tagline}</p>
          <div className="hl-row">
            <button className="btn btn-primary btn-sm" onClick={() => go("collector")}>
              Open dashboard
            </button>
            <button className="btn btn-sm" onClick={() => os.open(`project:${COLLECTOR.id}`)}>
              Read the write-up
            </button>
          </div>
        </div>
        <dl className="hl-mini">
          {COLLECTOR.metrics.slice(0, 3).map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <section className="hl-sec">
        <h3 className="hl-h3">How the work connects</h3>
        <p className="hl-p">Every project, role, and experiment, wired to the domains it touches. Click a node to trace it; drag one to pull the graph apart.</p>
        <div className="force-dark hl-topo">
          <Suspense fallback={<Loading label="Mapping" />}>
            <Topology onOpen={(t) => os.open(t)} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function Collector() {
  const os = useOS();
  const p = COLLECTOR;
  return (
    <div className="hl-page">
      <header className="hl-head">
        <span className="hl-k">Pipeline · {p.language}</span>
        <h2>{p.name}</h2>
        <p>{p.overview}</p>
        <div className="hl-row">
          {p.repo && (
            <a className="btn btn-sm" href={p.repo} target="_blank" rel="noreferrer">
              <FaGithub /> Repository
            </a>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => os.open(`project:${p.id}`)}>
            Full write-up
          </button>
        </div>
      </header>

      <section className="hl-sec">
        <h3 className="hl-h3">
          Measured results <span className="real-badge">from benchmark runs</span>
        </h3>
        <dl className="hl-metrics">
          {p.metrics.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
              {m.context && <dd className="hl-mc">{m.context}</dd>}
            </div>
          ))}
        </dl>
      </section>

      <section className="hl-sec">
        <h3 className="hl-h3">Architecture</h3>
        <ArchExplorer p={p} />
      </section>

      <section className="hl-sec">
        <h3 className="hl-h3">Data flow</h3>
        <ol className="hl-flows">
          {flows(p).map((f, i) => (
            <li key={i}>
              {f.map((h, j) => (
                <span key={j} className="hl-hop">
                  {j > 0 && <span className="hl-arrow">{h.via ? `→ ${h.via} →` : "→"}</span>}
                  <span className="hl-stop">{h.label}</span>
                </span>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <section className="hl-sec">
        <h3 className="hl-h3">
          Live admission control <SimBadge />
        </h3>
        <p className="hl-p">
          The collector&rsquo;s core idea, as a model you can push: offered load, workers, and a bounded queue. Every number below is
          generated in your browser by the simulation. None of it comes from a running system.
        </p>
        <div className="force-dark bp-host">
          <Suspense fallback={<Loading label="Starting simulation" />}>
            <Backpressure />
          </Suspense>
        </div>
      </section>

      <section className="hl-sec">
        <h3 className="hl-h3">Engineering decisions</h3>
        <div className="hl-decisions">
          {p.decisions.map((d) => (
            <div key={d.title}>
              <h4>{d.title}</h4>
              <p>{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hl-sec">
        <h3 className="hl-h3">Stack</h3>
        <ul className="chips">
          {p.stack.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ArchitectureTab() {
  const os = useOS();
  const [id, setId] = useState(projects[0].id);
  const p = projectById[id];
  return (
    <div className="hl-page">
      <header className="hl-head">
        <h2>Architecture explorer</h2>
        <p>Pick a system, then click any component to see what feeds it and what it feeds.</p>
      </header>
      <div className="hl-pills" role="tablist" aria-label="Systems">
        {projects.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)}>
            {x.name}
          </button>
        ))}
      </div>
      <ArchExplorer p={p} />
      <div className="hl-row hl-gap">
        <button className="btn btn-sm" onClick={() => os.open(docTarget(p))}>
          Read the {p.name} write-up
        </button>
      </div>
    </div>
  );
}

const CLASSES: { key: string; label: string; match: RegExp }[] = [
  { key: "compute", label: "Runs on", match: /kubernetes|gke|ecs|fargate|ec2|openshift|docker|helm|lambda/i },
  { key: "data", label: "Stores data in", match: /postgres|redis|elasticache|rds|timescale|mssql|influx|minio|blob|sqlite|mysql/i },
  { key: "messaging", label: "Moves data with", match: /kafka|sqs|event hubs|flink|websocket|sse|grpc|otlp/i },
  { key: "observe", label: "Observed with", match: /prometheus|grafana|loki|opentelemetry|cloudwatch|elasticsearch|kibana|logstash/i },
  { key: "ops", label: "Provisioned / shipped by", match: /terraform|github actions|azure devops|flyway|ci/i },
];

function Infrastructure() {
  const os = useOS();
  const rows = useMemo(
    () => [
      ...projects.map((p) => ({ name: p.name, sub: p.language, target: docTarget(p), stack: p.stack })),
      ...experience.map((r) => ({ name: r.company.replace(/ \(.*\)$/, ""), sub: r.role, target: "experience", stack: r.stack })),
    ],
    [],
  );
  const clouds = useMemo(() => {
    const all = rows.flatMap((r) => r.stack.map((s) => ({ s, r: r.name })));
    const count = (re: RegExp) => new Set(all.filter((x) => re.test(x.s)).map((x) => x.r)).size;
    return [
      { name: "AWS", n: count(/aws|ecs|fargate|ec2|elasticache|rds|sqs|ecr|cloudwatch/i) },
      { name: "Google Cloud", n: count(/gke|gcp/i) },
      { name: "Azure", n: count(/azure/i) },
      { name: "Kubernetes / OpenShift", n: count(/kubernetes|gke|openshift|helm/i) },
    ];
  }, [rows]);
  return (
    <div className="hl-page">
      <header className="hl-head">
        <h2>Infrastructure inventory</h2>
        <p>Where each system and role runs, what it stores data in, and how it&rsquo;s shipped. Derived from each project&rsquo;s documented stack.</p>
      </header>
      <div className="hl-clouds">
        {clouds.map((c) => (
          <div key={c.name}>
            <b>{c.n}</b>
            <span>{c.name}</span>
          </div>
        ))}
      </div>
      <div className="hl-table-wrap">
        <table className="hl-table">
          <thead>
            <tr>
              <th>System</th>
              {CLASSES.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <th scope="row">
                  <button onClick={() => os.open(r.target)}>{r.name}</button>
                  <span>{r.sub}</span>
                </th>
                {CLASSES.map((c) => {
                  const items = r.stack.filter((s) => c.match.test(s));
                  return <td key={c.key}>{items.length ? items.join(", ") : <span className="hl-none">·</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Experiments({ focus, go }: { focus?: string; go: (t: Tab) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    ref.current?.querySelector(`[data-id="${focus}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);
  return (
    <div className="hl-page" ref={ref}>
      <header className="hl-head">
        <h2>Experiments</h2>
        <p>Research spikes, side projects, and first-principles rebuilds. Some are finished; some exist mainly to understand how the real thing works.</p>
      </header>
      <div className="hl-exps">
        {lab.map((l) => {
          const role = l.roleId ? experience.find((r) => r.id === l.roleId) : undefined;
          return (
            <article key={l.id} data-id={l.id} className={`hl-exp${focus === l.id ? " is-focus" : ""}`}>
              <div className="hl-exp-top">
                <span className="hl-k">
                  {l.kind === "interactive" ? "Simulation" : l.language}
                  {role ? ` · research at ${role.shortName}` : ""}
                </span>
                {l.repo && (
                  <a href={l.repo} target="_blank" rel="noreferrer" aria-label={`${l.name} on GitHub`}>
                    <FaGithub />
                  </a>
                )}
              </div>
              <h3>{l.name}</h3>
              <p>{l.description}</p>
              <ul className="chips">
                {l.tags.map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
              {l.kind === "interactive" && (
                <button className="btn btn-sm" onClick={() => go("collector")}>
                  <Boxes size={14} /> Run the simulation
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeLab({ arg }: AppProps) {
  const parse = (a?: string): { tab: Tab; focus?: string } => {
    if (!a) return { tab: "overview" };
    const [t, f] = a.split(":");
    return TABS.some((x) => x.id === t) ? { tab: t as Tab, focus: f } : { tab: "overview" };
  };
  const [state, setState] = useState(() => parse(arg));
  useEffect(() => setState(parse(arg)), [arg]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const go = (tab: Tab) => {
    setState({ tab });
    bodyRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="hl">
      <nav className="hl-side" role="tablist" aria-label="Home Lab sections" aria-orientation="vertical">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={state.tab === t.id} onClick={() => go(t.id)}>
            <t.icon size={15} />
            <span>{t.label}</span>
          </button>
        ))}
        <p className="hl-side-note">Measured numbers come from benchmark runs. Simulations are labelled.</p>
      </nav>
      <div className="hl-body" ref={bodyRef} role="tabpanel">
        {state.tab === "overview" && <Overview go={go} />}
        {state.tab === "collector" && <Collector />}
        {state.tab === "architecture" && <ArchitectureTab />}
        {state.tab === "infrastructure" && <Infrastructure />}
        {state.tab === "experiments" && <Experiments focus={state.focus} go={go} />}
      </div>
    </div>
  );
}
