import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Globe, House, Lock, RotateCw } from "lucide-react";
import { profile } from "../../data/profile";
import { projects } from "../../data/projects";
import { lab } from "../../data/lab";
import { contributions, STATUS_LABEL } from "../../data/opensource";
import { useOS } from "../store";
import type { AppProps } from "../types";

const START = "portfolio://start";

interface Bookmark {
  title: string;
  url: string;
  note?: string;
  /** iratanshOS document that covers the same thing. */
  doc?: string;
}

function useBookmarks() {
  return useMemo(() => {
    const groups: { name: string; items: Bookmark[] }[] = [
      {
        name: "Profiles",
        items: [
          { title: "GitHub", url: profile.links.github, note: `@${profile.handle}` },
          { title: "LinkedIn", url: profile.links.linkedin },
          { title: "This site's source", url: profile.siteRepo, note: "iratanshOS on GitHub" },
        ],
      },
      {
        name: "Project repositories",
        items: projects
          .filter((p) => p.repo && p.kind !== "upstream")
          .map((p) => ({ title: p.name, url: p.repo!, note: p.tagline, doc: `project:${p.id}` })),
      },
      {
        name: "Open source",
        items: contributions.map((c) => ({
          title: `${c.repo} #${c.number}`,
          url: c.url,
          note: `${STATUS_LABEL[c.status]}: ${c.title}`,
          doc: `oss:${c.id}`,
        })),
      },
      {
        name: "Experiments",
        items: lab.filter((l) => l.repo).map((l) => ({ title: l.name, url: l.repo!, note: l.description, doc: `lab:${l.id}` })),
      },
    ];
    const extra = projects.flatMap((p) => p.links ?? []).map((l) => ({ title: l.label, url: l.href }));
    if (extra.length) groups.push({ name: "Project links", items: extra });
    return groups;
  }, []);
}

const host = (u: string) => {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
};

export default function Browser({ arg }: AppProps) {
  const os = useOS();
  const groups = useBookmarks();
  const all = groups.flatMap((g) => g.items);
  const [hist, setHist] = useState({ stack: [arg && /^https?:/.test(arg) ? arg : START], i: 0 });
  const url = hist.stack[hist.i];
  const [draft, setDraft] = useState<string | null>(null);

  const go = (u: string) => {
    let next = u.trim();
    if (!next) return;
    if (next !== START && !/^https?:\/\//.test(next)) next = /\.\w{2,}/.test(next) ? `https://${next}` : START;
    setHist((h) => ({ stack: [...h.stack.slice(0, h.i + 1), next], i: h.i + 1 }));
    setDraft(null);
  };
  const bm = all.find((b) => b.url === url);

  return (
    <div className="browser">
      <div className="browser-bar">
        <div className="seg">
          <button onClick={() => setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) }))} disabled={hist.i === 0} aria-label="Back">
            <ArrowLeft size={15} />
          </button>
          <button
            onClick={() => setHist((h) => ({ ...h, i: Math.min(h.stack.length - 1, h.i + 1) }))}
            disabled={hist.i >= hist.stack.length - 1}
            aria-label="Forward"
          >
            <ArrowRight size={15} />
          </button>
          <button onClick={() => go(START)} aria-label="Start page">
            <House size={14} />
          </button>
        </div>
        <form
          className="browser-url"
          onSubmit={(e) => {
            e.preventDefault();
            go(draft ?? url);
          }}
        >
          {url === START ? <Globe size={13} /> : <Lock size={12} />}
          <input
            value={draft ?? url}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label="Address"
            spellCheck={false}
          />
          <button type="submit" aria-label="Go" className="browser-go">
            <RotateCw size={13} />
          </button>
        </form>
      </div>

      <div className="browser-page">
        {url === START ? (
          <div className="browser-start">
            <h2>Bookmarks</h2>
            <p className="browser-lede">Everything this portfolio links to, in one place. External sites open in a new tab.</p>
            {groups.map((g) => (
              <section key={g.name}>
                <h3>{g.name}</h3>
                <ul className="bm-grid">
                  {g.items.map((b) => (
                    <li key={b.url + b.title}>
                      <button className="bm" onClick={() => go(b.url)}>
                        <span className="bm-host">{host(b.url)}</span>
                        <strong>{b.title}</strong>
                        {b.note && <span className="bm-note">{b.note}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="browser-ext">
            <Globe size={28} className="browser-ext-icon" />
            <span className="bm-host">{host(url)}</span>
            <h2>{bm?.title ?? host(url)}</h2>
            {bm?.note && <p>{bm.note}</p>}
            <code className="browser-ext-url">{url}</code>
            <div className="hl-row">
              <a className="btn btn-primary" href={url} target="_blank" rel="noreferrer noopener">
                Open in a new tab <ExternalLink size={14} />
              </a>
              {bm?.doc && (
                <button className="btn" onClick={() => os.open(bm.doc!)}>
                  Read it in iratanshOS
                </button>
              )}
            </div>
            <p className="browser-why">
              Most sites, GitHub and LinkedIn included, refuse to be displayed inside another page, so this browser hands
              external links to a real tab instead of showing a blank frame.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
