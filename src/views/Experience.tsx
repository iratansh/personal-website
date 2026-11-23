import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNexus } from "../lib/nexus";
import { toHref } from "../lib/routes";
import { experience } from "../data/experience";
import { lab } from "../data/lab";
import { Icon } from "../components/ui/Icon";
import { profile } from "../data/profile";
import { currentMonthIndex, formatMonth, monthIndex } from "../lib/hooks";
import { Reveal, ViewHeader } from "../components/ui/Primitives";

function status(start: string, end: string) {
  const now = currentMonthIndex();
  if (now < monthIndex(start)) return "scheduled";
  if (now > monthIndex(end)) return "completed";
  return "active";
}

export default function Experience() {
  const { route, reducedMotion } = useNexus();
  const [focus, setFocus] = useState<string | null>(route.param ?? null);

  const starts = experience.map((r) => monthIndex(r.start));
  const ends = experience.map((r) => monthIndex(r.end) + 1);
  const min = Math.min(...starts) - 1;
  const max = Math.max(...ends) + 1;
  const span = max - min;
  const pct = (m: number) => ((m - min) / span) * 100;
  const now = currentMonthIndex();
  const years: number[] = [];
  for (let y = Math.ceil(min / 12); y * 12 < max; y++) years.push(y);

  useEffect(() => {
    if (!route.param) return;
    setFocus(route.param);
    const el = document.getElementById(`role-${route.param}`);
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }), 120);
  }, [route.param, reducedMotion]);

  return (
    <div className="view experience">
      <ViewHeader
        index="03"
        kicker="Experience"
        title="An operational timeline."
        lede="Production work across agentic AI and internal tooling at a bank, full-stack and data engineering in heavy industry, and robotics research."
      />

      <div className="gantt frame" role="img" aria-label="Timeline of roles">
        <div className="gantt-axis">
          {years.map((y) => (
            <span key={y} className="gantt-year mono" style={{ left: `${pct(y * 12)}%` }}>
              {y}
            </span>
          ))}
          {Array.from({ length: span }, (_, i) => min + i)
            .filter((m) => m % 3 === 0)
            .map((m) => (
              <span key={m} className={`gantt-tick ${m % 12 === 0 ? "major" : ""}`} style={{ left: `${pct(m)}%` }} />
            ))}
        </div>
        <div className="gantt-tracks">
          {experience.map((r, i) => {
            const st = status(r.start, r.end);
            return (
              <div key={r.id} className="gantt-track">
                <motion.button
                  className={`gantt-bar st-${st}`}
                  aria-pressed={focus === r.id}
                  style={{ left: `${pct(monthIndex(r.start))}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct(monthIndex(r.end) + 1) - pct(monthIndex(r.start))}%` }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => {
                    setFocus(r.id);
                    document.getElementById(`role-${r.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span className="mono">{r.shortName}</span>
                </motion.button>
              </div>
            );
          })}
        </div>
        {now > min && now < max && (
          <div className="gantt-now" style={{ left: `${pct(now + 0.5)}%` }}>
            <span className="label">now</span>
          </div>
        )}
      </div>

      <ol className="log">
        {experience.map((r) => {
          const st = status(r.start, r.end);
          const months = monthIndex(r.end) - monthIndex(r.start) + 1;
          return (
            <Reveal as="li" key={r.id}>
              <article
                id={`role-${r.id}`}
                className={`log-entry ${focus === r.id ? "is-focus" : ""}`}
                onMouseEnter={() => setFocus(r.id)}
              >
                <div className="log-when">
                  <span className="mono">
                    {formatMonth(r.start)} <span className="dim">→</span> {formatMonth(r.end)}
                  </span>
                  <span className="label">
                    {months} mo · {r.location}
                  </span>
                  <span className={`log-status label st-${st}`}>
                    <span className="dot" /> {st}
                  </span>
                </div>
                <div className="log-body">
                  <h2>
                    {r.company}
                  </h2>
                  <p className="log-role">
                    {r.role}
                    {r.team && <span className="dim"> · {r.team}</span>}
                  </p>
                  <p className="log-summary">{r.summary}</p>
                  <ul className="log-lines">
                    {r.highlights.map((h, i) => (
                      <li key={i}>
                        <span className="mono log-ln">{String(i + 1).padStart(2, "0")}</span>
                        <p>{h}</p>
                      </li>
                    ))}
                  </ul>
                  {lab.some((l) => l.roleId === r.id) && (
                    <div className="log-repos">
                      <span className="label">Research repos</span>
                      {lab
                        .filter((l) => l.roleId === r.id)
                        .map((l) => (
                          <a key={l.id} className="link-arrow" href={toHref({ module: "lab", param: l.id })}>
                            {l.name} <Icon name="arrowRight" />
                          </a>
                        ))}
                    </div>
                  )}
                  <div className="log-stack">
                    {r.stack.map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
        <Reveal as="li">
          <article className="log-entry log-edu">
            <div className="log-when">
              <span className="mono">Expected {profile.education.expected}</span>
              <span className="label">{profile.education.location}</span>
            </div>
            <div className="log-body">
              <h2>{profile.education.school}</h2>
              <p className="log-role">{profile.education.degree}</p>
              <a className="link-arrow" href={toHref({ module: "contact" })}>
                {profile.openTo} →
              </a>
            </div>
          </article>
        </Reveal>
      </ol>
    </div>
  );
}
