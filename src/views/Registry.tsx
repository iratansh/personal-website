import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa6";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { projects } from "../data/projects";
import { Icon } from "../components/ui/Icon";
import { ViewHeader } from "../components/ui/Primitives";
import { ArchitectureDiagram } from "../components/viz/ArchitectureDiagram";
import ProjectDetail from "./ProjectDetail";

const KIND: Record<string, string> = {
  service: "Service",
  platform: "Platform",
  pipeline: "Pipeline",
  upstream: "Open-source contribution",
  runtime: "Runtime",
  application: "Application",
};

export default function Registry() {
  const { route } = useNexus();
  if (route.param) return <ProjectDetail id={route.param} />;
  return <RegistryList />;
}

function RegistryList() {
  return (
    <div className="view registry">
      <ViewHeader
        index="02"
        kicker="Project Registry"
        title="Systems, built and measured."
        lede="Each entry is a system I designed and built, with its architecture, the decisions behind it, and the numbers I could actually measure."
      />

      <ol className="reg-cards">
        {projects.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <a href={toHref({ module: "registry", param: p.id })} className="reg-card">
              <div className="reg-card-copy">
                <span className="reg-card-kicker label">
                  <span className="accent">{String(i + 1).padStart(2, "0")}</span> {KIND[p.kind]} · {p.language}
                </span>
                <h2 className="reg-card-name">{p.name}</h2>
                <p className="reg-card-tagline">{p.tagline}</p>

                {p.metrics.length > 0 ? (
                  <dl className="reg-card-metrics">
                    {p.metrics.slice(0, 2).map((m) => (
                      <div key={m.label}>
                        <dt>{m.label}</dt>
                        <dd className="mono">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="reg-card-stack mono">{p.stack.slice(0, 5).join(" · ")}</p>
                )}

                <span className="reg-card-go">
                  Read the breakdown <Icon name="arrowRight" className="nudge" />
                  {p.repo && <FaGithub className="reg-card-repo" aria-label="Has public repository" />}
                </span>
              </div>
              <div className="reg-card-viz">
                <ArchitectureDiagram nodes={p.architecture.nodes} edges={p.architecture.edges} thumbnail />
              </div>
            </a>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
