import { lazy, Suspense, useEffect } from "react";
import { FaGithub } from "react-icons/fa6";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { lab } from "../data/lab";
import { Icon } from "../components/ui/Icon";
import { Reveal, SectionHead, ViewHeader } from "../components/ui/Primitives";

const Backpressure = lazy(() => import("../components/viz/Backpressure"));

export default function Lab() {
  const { route } = useNexus();
  const featured = lab.find((l) => l.kind === "interactive")!;
  const repos = lab.filter((l) => l.kind === "repo");

  useEffect(() => {
    if (!route.param) return;
    const el = document.getElementById(`lab-${route.param}`);
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [route.param]);

  return (
    <div className="view lab">
      <ViewHeader
        index="04"
        kicker="Technical Lab"
        title="Things built out of curiosity."
        lede="Experiments, research spikes, and first-principles rebuilds. Some are finished; some exist mainly to understand how the real thing works."
      />

      <section id={`lab-${featured.id}`} className="lab-featured">
        <SectionHead
          index="EXP-00"
          title={featured.name}
          aside={
            <a className="link-arrow" href={toHref({ module: "knowledge", param: "reject-dont-buffer" })}>
              Read the note <Icon name="arrowRight" />
            </a>
          }
        />
        <p className="lab-featured-desc">{featured.description}</p>
        <Suspense fallback={<div className="bp-stage frame bp-loading" />}>
          <Backpressure />
        </Suspense>
      </section>

      <section className="lab-specimens">
        <SectionHead title="Side projects" aside={<span className="label">{repos.length} repositories</span>} />
        <ul className="specimens">
          {repos.map((l, i) => (
            <Reveal as="li" key={l.id} delay={i * 0.04}>
              <article
                id={`lab-${l.id}`}
                className={`specimen frame ${route.param === l.id ? "is-focus" : ""}`}
              >
                <div className="specimen-top">
                  <span className="label">
                    EXP-{String(i + 1).padStart(2, "0")} · {l.language}
                  </span>
                  {l.repo && (
                    <a href={l.repo} target="_blank" rel="noreferrer" aria-label={`${l.name} on GitHub`}>
                      <FaGithub />
                    </a>
                  )}
                </div>
                <h3>{l.name}</h3>
                <p>{l.description}</p>
                <div className="specimen-tags">
                  {l.tags.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </section>
    </div>
  );
}
