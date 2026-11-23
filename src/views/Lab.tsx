import { lazy, Suspense, useEffect } from "react";
import { FaGithub } from "react-icons/fa6";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { lab } from "../data/lab";
import type { LabEntry } from "../data/types";
import { Icon } from "../components/ui/Icon";
import { Reveal, SectionHead, ViewHeader } from "../components/ui/Primitives";

const Backpressure = lazy(() => import("../components/viz/Backpressure"));

export default function Lab() {
  const { route } = useNexus();
  const featured = lab.find((l) => l.kind === "interactive")!;
  const repos = lab.filter((l) => l.kind === "repo");
  const research = repos.filter((l) => l.roleId === "ualberta");
  const side = repos.filter((l) => !l.roleId);

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
        title="Experiments and research."
        lede="Side projects and first-principles rebuilds, plus the robotics repos from my ML research internship at the University of Alberta."
      />

      <section id={`lab-${featured.id}`} className="lab-featured">
        <SectionHead
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
        <SectionHead
          title="Research · University of Alberta"
          aside={
            <a className="link-arrow" href={toHref({ module: "experience", param: "ualberta" })}>
              ML Research Intern <Icon name="arrowRight" />
            </a>
          }
        />
        <Specimens items={research} focus={route.param} />
      </section>

      <section className="lab-specimens">
        <SectionHead title="Side projects" aside={<span className="label">{side.length} repositories</span>} />
        <Specimens items={side} focus={route.param} />
      </section>
    </div>
  );
}

function Specimens({ items, focus }: { items: LabEntry[]; focus?: string }) {
  return (
    <ul className="specimens">
      {items.map((l, i) => (
        <Reveal as="li" key={l.id} delay={i * 0.04}>
          <article id={`lab-${l.id}`} className={`specimen frame ${focus === l.id ? "is-focus" : ""}`}>
            <div className="specimen-top">
              <span className="label">{l.language}</span>
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
  );
}
