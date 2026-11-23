import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { profile, verifiedOutputs } from "../data/profile";
import { experience, skills } from "../data/experience";
import { projects } from "../data/projects";
import { Icon } from "../components/ui/Icon";
import { Reveal, SectionHead } from "../components/ui/Primitives";

const Backpressure = lazy(() => import("../components/viz/Backpressure"));
const Topology = lazy(() => import("../components/viz/Topology"));

const ease = [0.16, 1, 0.3, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

export default function Overview() {
  const { setTerminalOpen } = useNexus();
  const current = experience[0];

  return (
    <div className="view overview">
      <section className="hero" aria-labelledby="hero-name">
        <div className="hero-copy">
          <motion.div className="hero-status label" {...rise(0.05)}>
            <span className="dot pulse" /> Online <span className="dim">·</span> {current.role} @ {current.shortName}
          </motion.div>

          <motion.h1 id="hero-name" className="hero-name" {...rise(0.12)}>
            {profile.name}
          </motion.h1>

          <motion.p className="hero-headline" {...rise(0.25)}>
            {profile.headline.before} <span className="serif accent-2">{profile.headline.accent}</span>{" "}
            {profile.headline.after}
          </motion.p>

          <motion.p className="hero-intro" {...rise(0.35)}>
            {profile.intro}
          </motion.p>

          <motion.div className="hero-actions" {...rise(0.45)}>
            <a className="btn btn-primary" href={toHref({ module: "registry" })}>
              Explore the registry <Icon name="arrowRight" className="nudge" />
            </a>
            <button className="btn" onClick={() => setTerminalOpen(true)}>
              <Icon name="terminal" /> Open terminal
            </button>
            <a className="btn btn-ghost" href={profile.resume} target="_blank" rel="noreferrer">
              Résumé <Icon name="arrowUpRight" />
            </a>
          </motion.div>

          <motion.dl className="spec" {...rise(0.55)}>
            <div>
              <dt className="label">Education</dt>
              <dd>
                {profile.education.school}
                <span className="dim"> · BSc CS, expected {profile.education.expected}</span>
              </dd>
            </div>
            <div>
              <dt className="label">Focus</dt>
              <dd>Backend · Full-stack · Distributed systems · Cloud &amp; SRE · Applied AI</dd>
            </div>
            <div>
              <dt className="label">Links</dt>
              <dd className="spec-links">
                <a href={profile.links.github} target="_blank" rel="noreferrer">
                  <FaGithub /> {profile.handle}
                </a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
                  <FaLinkedinIn /> ishaan-ratanshi
                </a>
                <a href={`mailto:${profile.email}`}>
                  <Icon name="mail" size={14} /> email
                </a>
              </dd>
            </div>
          </motion.dl>
        </div>

        <motion.div
          className="hero-viz"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
        >
          <Suspense fallback={<div className="bp-stage frame bp-loading" />}>
            <Backpressure compact />
          </Suspense>
          <p className="hero-viz-caption">
            Live: past capacity, requests are rejected instead of queued, so latency stays bounded. From the{" "}
            <a href={toHref({ module: "registry", param: "telemetry-collector" })}>Telemetry Collector</a>.
          </p>
        </motion.div>
      </section>

      <section className="ov-section" aria-labelledby="outputs-h">
        <SectionHead
          index="01.1"
          title="Production outputs"
          aside={
            <a className="link-arrow" href={toHref({ module: "experience" })}>
              Sources <Icon name="arrowRight" />
            </a>
          }
        />
        <h2 id="outputs-h" className="sr-only">
          Production outputs
        </h2>
        <ul className="outputs">
          {verifiedOutputs.map((o, i) => (
            <Reveal as="li" key={o.label} delay={i * 0.05} className="output">
              <span className="output-value mono">{o.value}</span>
              <span className="output-label">{o.label}</span>
              <span className="output-src label">{o.source}</span>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="ov-section ov-map" aria-labelledby="map-h">
        <SectionHead index="01.2" title="How the work connects" />
        <h2 id="map-h" className="sr-only">
          How the work connects
        </h2>
        <Reveal>
          <p className="ov-map-lede">
            Every project, role, and lab entry, wired to the domains it touches. Click a node to trace it.
          </p>
        </Reveal>
        <Suspense fallback={<div className="topo-stage frame topo-loading label">Mapping topology…</div>}>
          <Topology />
        </Suspense>
      </section>

      <section className="ov-grid">
        <Reveal className="ov-cell ov-cell-wide">
          <SectionHead index="01.3" title="Toolchain" />
          <div className="toolchain">
            {Object.entries(skills).map(([group, items]) => (
              <div key={group} className="toolchain-group">
                <h3 className="label">{group}</h3>
                <p>
                  {items.map((s, i) => (
                    <span key={s}>
                      {s}
                      {i < items.length - 1 && <span className="sep"> / </span>}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <Reveal className="ov-next">
        <a href={toHref({ module: "registry" })} className="ov-next-link">
          <span className="label">Next</span>
          <span className="ov-next-title">
            Project Registry <span className="dim">· {projects.length} projects</span>
          </span>
          <Icon name="arrowRight" size={22} />
        </a>
      </Reveal>
    </div>
  );
}
