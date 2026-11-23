/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { profile } from "../../data/profile";
import { projects, projectById } from "../../data/projects";
import { experience, skills } from "../../data/experience";
import { notes, noteById } from "../../data/knowledge";
import { lab } from "../../data/lab";
import { moduleById, modules, type ModuleId, type Route } from "../../lib/routes";
import { formatDuration, formatMonth } from "../../lib/hooks";
import { track } from "../../analytics";

export interface CommandContext {
  navigate: (r: Route) => void;
  route: Route;
  clear: () => void;
  close: () => void;
  history: string[];
  sessionStart: number;
  setOverdrive: (on: boolean) => void;
  overdrive: boolean;
  cycleMotion: () => void;
}

export type Output = ReactNode;

interface Command {
  desc: string;
  hidden?: boolean;
  usage?: string;
  run: (args: string[], ctx: CommandContext) => Output;
}

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="t-link">
    {children}
  </a>
);

const Row = ({ k, v }: { k: string; v: ReactNode }) => (
  <div className="t-row">
    <span className="t-key">{k}</span>
    <span>{v}</span>
  </div>
);

const ALIASES: Record<string, ModuleId> = {
  "~": "overview",
  home: "overview",
  overview: "overview",
  registry: "registry",
  projects: "registry",
  experience: "experience",
  exp: "experience",
  lab: "lab",
  kb: "knowledge",
  knowledge: "knowledge",
  notes: "knowledge",
  contact: "contact",
  privacy: "privacy",
};

/** Resolve "papertrade", "registry/papertrade", "rbc", "kb/wal-recovery", … to a route. */
export function resolveTarget(raw: string): Route | null {
  const t = raw.replace(/^~\/?/, "").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!t) return { module: "overview" };
  const [a, b] = t.split("/");
  if (b && ALIASES[a]) return { module: ALIASES[a], param: b };
  if (ALIASES[a]) return { module: ALIASES[a] };
  if (projectById[a]) return { module: "registry", param: a };
  const p = projects.find((x) => x.name.toLowerCase().replace(/\s+/g, "-") === a || x.id.startsWith(a));
  if (p) return { module: "registry", param: p.id };
  const r = experience.find((x) => x.id === a || x.shortName.toLowerCase() === a);
  if (r) return { module: "experience", param: r.id };
  if (noteById[a]) return { module: "knowledge", param: a };
  const l = lab.find((x) => x.id === a);
  if (l) return { module: "lab", param: l.id };
  return null;
}

export const commands: Record<string, Command> = {
  help: {
    desc: "List available commands",
    run: (args) => {
      const all = args.includes("--all") || args.includes("-a");
      const list = Object.entries(commands).filter(([, c]) => all || !c.hidden);
      return (
        <div>
          <div className="t-dim">{all ? "All commands, including the ones that aren't useful:" : "Available commands:"}</div>
          <div className="t-grid">
            {list.map(([name, c]) => (
              <Row key={name} k={c.usage ?? name} v={<span className="t-dim">{c.desc}</span>} />
            ))}
          </div>
          {!all && <div className="t-dim">Tip: Tab completes, ↑/↓ walks history, Ctrl+L clears.</div>}
        </div>
      );
    },
  },
  about: {
    desc: "Who is this?",
    run: () => (
      <div>
        <div className="t-strong">{profile.name}</div>
        <div>{profile.intro}</div>
        <div className="t-dim">→ cd overview · open registry · cat resume</div>
      </div>
    ),
  },
  whoami: {
    desc: "Print the current user",
    hidden: true,
    run: () => "visitor, but the operator is " + profile.name + ". Try `about`.",
  },
  projects: {
    desc: "List projects in the registry",
    run: () => (
      <div className="t-grid">
        {projects.map((p) => (
          <Row
            key={p.id}
            k={p.id}
            v={
              <span>
                {p.name} <span className="t-dim">· {p.language} · {p.tagline}</span>
              </span>
            }
          />
        ))}
        <div className="t-dim">→ open &lt;id&gt; for the full breakdown</div>
      </div>
    ),
  },
  experience: {
    desc: "Print the operational timeline",
    run: () => (
      <div className="t-grid">
        {experience.map((r) => (
          <Row
            key={r.id}
            k={`${formatMonth(r.start)} → ${formatMonth(r.end)}`}
            v={
              <span>
                {r.role} <span className="t-dim">@ {r.company}</span>
              </span>
            }
          />
        ))}
        <div className="t-dim">→ open rbc · open evr · open ualberta</div>
      </div>
    ),
  },
  skills: {
    desc: "Show the toolchain",
    run: () => (
      <div className="t-grid">
        {Object.entries(skills).map(([k, v]) => (
          <Row key={k} k={k} v={v.join(", ")} />
        ))}
      </div>
    ),
  },
  open: {
    desc: "Open a module, project, role, or note",
    usage: "open <target>",
    run: (args, ctx) => {
      if (!args[0]) return <span className="t-warn">usage: open &lt;target&gt; (try `projects` for ids)</span>;
      const r = resolveTarget(args.join("-"));
      if (!r) return <span className="t-err">open: no such target: {args.join(" ")}</span>;
      ctx.navigate(r);
      return <span className="t-ok">→ {moduleById[r.module].path}{r.param ? `/${r.param}` : ""}</span>;
    },
  },
  cd: {
    desc: "Change module",
    usage: "cd <module>",
    run: (args, ctx) => {
      if (args[0] === "..") {
        ctx.navigate(ctx.route.param ? { module: ctx.route.module } : { module: "overview" });
        return null;
      }
      const r = resolveTarget(args[0] ?? "~");
      if (!r) return <span className="t-err">cd: no such module: {args[0]}</span>;
      ctx.navigate(r);
      return null;
    },
  },
  ls: {
    desc: "List modules (or contents of one)",
    run: (args, ctx) => {
      const target = args[0] ? resolveTarget(args[0]) : ctx.route.module === "overview" ? null : { module: ctx.route.module };
      if (target?.module === "registry") return commands.projects.run([], ctx);
      if (target?.module === "experience") return commands.experience.run([], ctx);
      if (target?.module === "knowledge")
        return (
          <div className="t-grid">
            {notes.map((n) => (
              <Row key={n.id} k={n.id} v={n.title} />
            ))}
          </div>
        );
      if (target?.module === "lab")
        return (
          <div className="t-grid">
            {lab.map((l) => (
              <Row key={l.id} k={l.id} v={l.name} />
            ))}
          </div>
        );
      return (
        <div className="t-cols">
          {modules.map((m) => (
            <span key={m.id} className="t-dir">
              {m.path === "~" ? "overview" : m.path.replace("~/", "")}/
            </span>
          ))}
          <span>resume.pdf</span>
          <span className="t-dim">.secrets</span>
        </div>
      );
    },
  },
  pwd: {
    desc: "Print working module",
    hidden: true,
    run: (_, ctx) => `/home/ishaan/${moduleById[ctx.route.module].path.replace(/^~\/?/, "")}${ctx.route.param ? "/" + ctx.route.param : ""}`,
  },
  github: {
    desc: "Open GitHub profile",
    run: () => {
      track("outbound_github", { target: "profile", source: "terminal" });
      window.open(profile.links.github, "_blank", "noopener");
      return <Ext href={profile.links.github}>{profile.links.github}</Ext>;
    },
  },
  linkedin: {
    desc: "Open LinkedIn profile",
    run: () => {
      track("outbound_linkedin", { source: "terminal" });
      window.open(profile.links.linkedin, "_blank", "noopener");
      return <Ext href={profile.links.linkedin}>{profile.links.linkedin}</Ext>;
    },
  },
  resume: {
    desc: "Open the résumé (PDF)",
    run: () => {
      track("resume_download", { source: "terminal" });
      window.open(profile.resume, "_blank", "noopener");
      return <span className="t-ok">opening resume.pdf…</span>;
    },
  },
  contact: {
    desc: "How to reach me",
    run: (_, ctx) => {
      ctx.navigate({ module: "contact" });
      return (
        <div className="t-grid">
          <Row k="email" v={<a className="t-link" href={`mailto:${profile.email}`}>{profile.email}</a>} />
          <Row k="linkedin" v={<Ext href={profile.links.linkedin}>{profile.links.linkedin}</Ext>} />
          <Row k="github" v={<Ext href={profile.links.github}>{profile.links.github}</Ext>} />
        </div>
      );
    },
  },
  neofetch: {
    desc: "System information",
    run: (_, ctx) => (
      <div className="t-neofetch">
        <pre className="t-logo">{`   ▗▖  ▗▖
   ▐▛▚▖▐▌
   ▐▌ ▝▜▌
   ▐▌  ▐▌`}</pre>
        <div>
          <div className="t-strong">
            ishaan<span className="t-dim">@</span>iratansh
          </div>
          <div className="t-dim">──────────────</div>
          <Row k="OS" v="iratansh 1.0 (browser)" />
          <Row k="Host" v={profile.education.school} />
          <Row k="Kernel" v="React 18 + TypeScript" />
          <Row k="Uptime" v={formatDuration(Date.now() - ctx.sessionStart)} />
          <Row k="Shell" v="ish" />
          <Row k="Role" v="SDE Co-op @ RBC" />
          <Row k="Langs" v={skills.Languages.join(" ")} />
          <div className="t-swatch">
            {["#34e0a1", "#5ad8ff", "#4d84ff", "#a68bff", "#ffbf5e", "#ff6274"].map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  history: {
    desc: "Show command history",
    hidden: true,
    run: (_, ctx) => (
      <div>
        {ctx.history.map((h, i) => (
          <div key={i}>
            <span className="t-dim">{String(i + 1).padStart(4, " ")}</span> {h}
          </div>
        ))}
      </div>
    ),
  },
  uptime: {
    desc: "How long you've been here",
    hidden: true,
    run: (_, ctx) => `up ${formatDuration(Date.now() - ctx.sessionStart)}, 1 user, load average: curious`,
  },
  date: { desc: "Print the date", hidden: true, run: () => new Date().toString() },
  echo: { desc: "Echo arguments", hidden: true, run: (args) => args.join(" ") },
  motion: {
    desc: "Toggle animations",
    usage: "motion",
    run: (_, ctx) => {
      ctx.cycleMotion();
      return <span className="t-ok">motion preference toggled</span>;
    },
  },
  privacy: {
    desc: "What this site measures",
    run: (_, ctx) => {
      ctx.navigate({ module: "privacy" });
      return <span className="t-ok">→ ~/privacy</span>;
    },
  },
  clear: { desc: "Clear the terminal", run: (_, ctx) => (ctx.clear(), null) },
  exit: {
    desc: "Close the terminal",
    run: (_, ctx) => (ctx.close(), null),
  },

  // --- Easter eggs ---
  sudo: {
    desc: "Elevate privileges",
    hidden: true,
    run: (args) =>
      args.join(" ").includes("rm -rf") ? (
        <span className="t-err">Nice try. This incident has been logged and will be discussed at the postmortem.</span>
      ) : (
        <span className="t-warn">visitor is not in the sudoers file. This incident will be reported.</span>
      ),
  },
  rm: {
    desc: "Remove files",
    hidden: true,
    run: () => <span className="t-err">rm: refusing to operate on a static site. It's all on GitHub anyway.</span>,
  },
  cat: {
    desc: "Print a file",
    hidden: true,
    usage: "cat <file>",
    run: (args, ctx) => {
      const f = args[0] ?? "";
      if (f.startsWith(".secret")) return <span className="t-violet">↑ ↑ ↓ ↓ ← → ← → B A</span>;
      if (f.includes("resume")) return commands.resume.run([], ctx);
      const n = noteById[f];
      if (n) {
        ctx.navigate({ module: "knowledge", param: n.id });
        return n.dek;
      }
      return <span className="t-err">cat: {f || "(nothing)"}: No such file</span>;
    },
  },
  coffee: {
    desc: "Brew",
    hidden: true,
    run: () => (
      <pre className="t-pre">{`   ( (
    ) )
  ........
  |      |]
  \\      /    HTTP 418: I'm a teapot.
   \`----'`}</pre>
    ),
  },
  ping: {
    desc: "Check connectivity",
    hidden: true,
    run: () => (
      <div>
        <div>PING ishaan (127.0.0.1): 56 data bytes</div>
        <div>64 bytes from ishaan: icmp_seq=0 ttl=64 time=0.042 ms</div>
        <div className="t-dim">Reply received. Response time to email is slower; see `contact`.</div>
      </div>
    ),
  },
  vim: { desc: "Edit", hidden: true, run: () => "You are now trapped in vim. Just kidding. Type :q (or anything else)." },
  ":q": { desc: "Quit vim", hidden: true, run: () => "Freedom." },
  hello: { desc: "Say hi", hidden: true, run: () => "Hey! 👋  Try `about`, or `open papertrade`." },
  overdrive: {
    desc: "???",
    hidden: true,
    run: (_, ctx) => {
      ctx.setOverdrive(!ctx.overdrive);
      return <span className="t-violet">{ctx.overdrive ? "Overdrive disengaged." : "OVERDRIVE ENGAGED."}</span>;
    },
  },
};

export const commandNames = Object.keys(commands);

export function completions(input: string): string[] {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) return commandNames.filter((c) => !commands[c].hidden && c.startsWith(parts[0]));
  const [cmd, partial = ""] = [parts[0], parts.slice(1).join("-")];
  if (!["open", "cd", "ls", "cat"].includes(cmd)) return [];
  const targets = [
    ...Object.keys(ALIASES).filter((a) => a !== "~"),
    ...projects.map((p) => p.id),
    ...experience.map((r) => r.id),
    ...notes.map((n) => n.id),
    ...lab.map((l) => l.id),
  ];
  return [...new Set(targets)].filter((t) => t.startsWith(partial.toLowerCase())).map((t) => `${cmd} ${t}`);
}
