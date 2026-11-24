import { useEffect, useRef, useState, type ReactNode } from "react";
import { allNodes, getNode, listFolder, unixPath } from "../fs";
import { useOS } from "../store";
import { useSettings, WALLPAPERS, type WallpaperId } from "../settings";
import type { AppProps, FsNode } from "../types";
import { profile } from "../../data/profile";
import { projects } from "../../data/projects";
import { experience, skills } from "../../data/experience";
import { contributions, STATUS_LABEL } from "../../data/opensource";
import { track } from "../../analytics";

type Out = ReactNode;
interface Ctx {
  os: ReturnType<typeof useOS>;
  settings: ReturnType<typeof useSettings>;
  cwd: string;
  setCwd: (id: string) => void;
  clear: () => void;
  history: string[];
  close: () => void;
}
interface Cmd {
  desc: string;
  usage?: string;
  hidden?: boolean;
  run: (args: string[], c: Ctx) => Out;
}

const Ok = ({ children }: { children: ReactNode }) => <span className="t-ok">{children}</span>;
const Dim = ({ children }: { children: ReactNode }) => <span className="t-dim">{children}</span>;
const Err = ({ children }: { children: ReactNode }) => <span className="t-err">{children}</span>;
const Link = ({ href, children }: { href: string; children: ReactNode }) => (
  <a className="t-link" href={href} target="_blank" rel="noreferrer">
    {children}
  </a>
);

/** Friendly aliases for `open`. Anything else is matched against filesystem names and ids. */
const OPEN_ALIASES: Record<string, string> = {
  projects: "projects",
  resume: "resume",
  cv: "resume",
  homelab: "app:homelab",
  lab: "app:homelab",
  about: "about",
  skills: "skills",
  experience: "experience",
  contact: "app:contact",
  terminal: "app:terminal",
  browser: "app:browser",
  settings: "app:settings",
  analytics: "app:analytics",
  opensource: "opensource",
  "open-source": "opensource",
  oss: "opensource",
  notes: "notes",
  files: "app:files",
  help: "help",
  privacy: "privacy",
};

const norm = (s: string) => s.toLowerCase().replace(/\.(md|txt|pdf)$/, "").replace(/[\s_-]+/g, "");

function findNode(query: string, cwd: string): FsNode | undefined {
  const q = norm(query);
  if (!q) return undefined;
  const alias = OPEN_ALIASES[query.toLowerCase()];
  if (alias) return getNode(alias);
  const here = listFolder(cwd).find((n) => norm(n.name) === q);
  if (here) return here;
  const all = allNodes();
  return (
    all.find((n) => norm(n.name) === q) ??
    all.find((n) => norm(n.id.split(":").pop() ?? "") === q) ??
    all.find((n) => norm(n.name).startsWith(q))
  );
}

const COMMANDS: Record<string, Cmd> = {
  help: {
    desc: "List commands",
    run: () => (
      <div className="t-help">
        {Object.entries(COMMANDS)
          .filter(([, c]) => !c.hidden)
          .map(([k, c]) => (
            <div key={k}>
              <span className="t-cmd">{c.usage ?? k}</span>
              <Dim>{c.desc}</Dim>
            </div>
          ))}
        <div className="t-gap">
          <Dim>Tip: Tab completes, ↑/↓ walk history. Some commands aren&rsquo;t listed.</Dim>
        </div>
      </div>
    ),
  },
  about: {
    desc: "Who's behind this",
    run: (_, c) => {
      c.os.open("about", { source: "terminal" });
      return (
        <div>
          <Ok>{profile.name}</Ok> · {profile.role}
          <div>{profile.intro}</div>
          <Dim>Opened About Me.txt</Dim>
        </div>
      );
    },
  },
  whoami: { desc: "Print the current user", hidden: true, run: () => `visitor. The operator is ${profile.name}. Try \`about\`.` },
  projects: {
    desc: "List projects",
    run: () => (
      <div>
        {projects
          .filter((p) => p.kind !== "upstream")
          .map((p) => (
            <div key={p.id} className="t-row">
              <span className="t-cmd">{p.id.padEnd(20, " ")}</span>
              <span>{p.tagline}</span>
            </div>
          ))}
        <Dim>open &lt;id&gt; to read one, e.g. `open {projects[0].id}`</Dim>
      </div>
    ),
  },
  experience: {
    desc: "Work history",
    run: () => (
      <div>
        {experience.map((r) => (
          <div key={r.id} className="t-row">
            <span className="t-cmd">{`${r.start} → ${r.end}`.padEnd(20, " ")}</span>
            <span>
              {r.role} · <Ok>{r.company}</Ok>
            </span>
          </div>
        ))}
        <Dim>`open experience` for details</Dim>
      </div>
    ),
  },
  skills: {
    desc: "Technical skills",
    run: () => (
      <div>
        {Object.entries(skills).map(([k, v]) => (
          <div key={k} className="t-row">
            <span className="t-cmd">{k.padEnd(22, " ")}</span>
            <span>{v.join(", ")}</span>
          </div>
        ))}
      </div>
    ),
  },
  opensource: {
    desc: "Open-source contributions",
    run: () => (
      <div>
        {contributions.map((c) => (
          <div key={c.id} className="t-row">
            <span className={c.status === "merged" ? "t-ok" : "t-warn"}>{STATUS_LABEL[c.status].toLowerCase().padEnd(12, " ")}</span>
            <span>
              {c.repo}#{c.number} <Dim>{c.title}</Dim>
            </span>
          </div>
        ))}
      </div>
    ),
  },
  github: {
    desc: "GitHub profile",
    run: () => <Link href={profile.links.github}>{profile.links.github}</Link>,
  },
  linkedin: { desc: "LinkedIn profile", run: () => <Link href={profile.links.linkedin}>{profile.links.linkedin}</Link> },
  resume: {
    desc: "Open the résumé",
    run: (_, c) => {
      c.os.open("resume", { source: "terminal" });
      return <Dim>Opened Resume.pdf</Dim>;
    },
  },
  contact: {
    desc: "How to reach me",
    run: (_, c) => (
      <div>
        <div>
          email&nbsp;&nbsp;&nbsp;&nbsp;<a className="t-link" href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
        <div>
          github&nbsp;&nbsp;&nbsp;<Link href={profile.links.github}>{profile.links.github}</Link>
        </div>
        <div>
          linkedin <Link href={profile.links.linkedin}>{profile.links.linkedin}</Link>
        </div>
        <button className="t-btn" onClick={() => c.os.open("app:contact")}>
          open contact app →
        </button>
      </div>
    ),
  },
  open: {
    desc: "Open an app, folder, or document",
    usage: "open <name>",
    run: (args, c) => {
      const q = args.join(" ");
      if (!q) return <Err>usage: open &lt;name&gt; (try: projects, resume, homelab, about, a project id)</Err>;
      const n = findNode(q, c.cwd);
      if (!n) return <Err>open: no such app, folder, or document: {q}</Err>;
      c.os.open(n.id, { source: "terminal" });
      return <Dim>Opened {n.name}</Dim>;
    },
  },
  ls: {
    desc: "List a folder",
    usage: "ls [folder]",
    run: (args, c) => {
      const target = args.length ? findNode(args.join(" "), c.cwd) : getNode(c.cwd);
      if (!target) return <Err>ls: cannot access &apos;{args.join(" ")}&apos;: No such file or directory</Err>;
      if (target.kind !== "folder") return target.name;
      return (
        <div className="t-ls">
          {listFolder(target.id).map((n) => (
            <span key={n.id} className={n.kind === "folder" ? "t-dir" : n.kind === "app" ? "t-app" : ""}>
              {n.name}
              {n.kind === "folder" ? "/" : n.kind === "app" ? "*" : ""}
            </span>
          ))}
        </div>
      );
    },
  },
  cd: {
    desc: "Change folder",
    usage: "cd <folder>",
    run: (args, c) => {
      const q = args.join(" ");
      if (!q || q === "~") return c.setCwd("root"), null;
      if (q === "..") return c.setCwd(getNode(c.cwd)?.parent ?? "root"), null;
      if (q === "/" ) return c.setCwd("root"), null;
      const n = findNode(q, c.cwd);
      if (!n || n.kind !== "folder") return <Err>cd: not a folder: {q}</Err>;
      c.setCwd(n.id);
      return null;
    },
  },
  pwd: { desc: "Print the current folder", hidden: true, run: (_, c) => unixPath(c.cwd) },
  cat: {
    desc: "Print a document's summary and open it",
    usage: "cat <file>",
    run: (args, c) => {
      const n = findNode(args.join(" "), c.cwd);
      if (!n) return <Err>cat: {args.join(" ")}: No such file</Err>;
      if (n.kind === "folder") return <Err>cat: {n.name}: Is a directory</Err>;
      c.os.open(n.id, { source: "terminal" });
      return (
        <div>
          <Ok>{n.name}</Ok> <Dim>({n.kindLabel})</Dim>
          <div>{n.description}</div>
        </div>
      );
    },
  },
  theme: {
    desc: "Switch appearance",
    usage: "theme dark|light",
    run: (args, c) => {
      const t = args[0];
      if (t !== "dark" && t !== "light") return <Err>usage: theme dark|light</Err>;
      c.settings.set("theme", t);
      return <Dim>Appearance: {t}</Dim>;
    },
  },
  wallpaper: {
    desc: "Change wallpaper",
    usage: "wallpaper <name>",
    run: (args, c) => {
      const w = WALLPAPERS.find((x) => x.id === args[0] || x.name.toLowerCase() === args[0]?.toLowerCase());
      if (!w) return <Err>wallpapers: {WALLPAPERS.map((x) => x.id).join(", ")}</Err>;
      c.settings.set("wallpaper", w.id as WallpaperId);
      return <Dim>Wallpaper: {w.name}</Dim>;
    },
  },
  history: { desc: "Command history", hidden: true, run: (_, c) => c.history.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`).join("\n") },
  date: { desc: "Print the date", hidden: true, run: () => new Date().toString() },
  echo: { desc: "Echo", hidden: true, run: (a) => a.join(" ") },
  neofetch: {
    desc: "System information",
    hidden: true,
    run: () => (
      <div className="t-neo">
        <pre className="t-art">{"   ▲\n  ▲ ▲\n ▲ ▲ ▲\n>_____"}</pre>
        <div>
          <Ok>visitor@iratanshos</Ok>
          <div>OS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iratanshOS 1.0 (in your browser)</div>
          <div>Host&nbsp;&nbsp;&nbsp;&nbsp;{profile.name}</div>
          <div>Kernel&nbsp;&nbsp;React 18 + TypeScript</div>
          <div>Shell&nbsp;&nbsp;&nbsp;ish (simulated)</div>
          <div>Role&nbsp;&nbsp;&nbsp;&nbsp;{experience[0].role} @ {experience[0].shortName}</div>
        </div>
      </div>
    ),
  },
  clear: { desc: "Clear the screen", run: (_, c) => (c.clear(), null) },
  exit: { desc: "Close the terminal", run: (_, c) => (c.close(), null) },
  /* Easter eggs */
  sudo: { desc: "", hidden: true, run: () => <Err>visitor is not in the sudoers file. This incident will be reported to /dev/null.</Err> },
  rm: { desc: "", hidden: true, run: (a) => (a.includes("-rf") ? <Err>Nice try. This filesystem is read-only, and also imaginary.</Err> : <Err>rm: permission denied</Err>) },
  coffee: { desc: "", hidden: true, run: () => <pre className="t-art">{"   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----'\nHTTP 418: I'm a teapot."}</pre> },
  vim: { desc: "", hidden: true, run: () => "You are now trapped in vim. Just kidding. Type :q (or anything)." },
  ":q": { desc: "", hidden: true, run: () => "Freedom." },
  hello: { desc: "", hidden: true, run: () => "Hey! Try `projects`, or `open homelab`." },
  ping: { desc: "", hidden: true, run: (a) => `PING ${a[0] ?? "ishaan"}: reply in 1 business day. Faster: \`contact\`.` },
  fortune: {
    desc: "",
    hidden: true,
    run: () =>
      ["Reject, don't buffer.", "Degrade, don't fail.", "Locks should never span network I/O.", "Keep analytics off the hot path."][
        Math.floor(Math.random() * 4)
      ],
  },
  overdrive: {
    desc: "",
    hidden: true,
    run: (_, c) => {
      c.settings.setOverdrive(!c.settings.overdrive);
      track("easter_egg", { name: "overdrive" });
      return <Ok>{c.settings.overdrive ? "Overdrive disengaged." : "OVERDRIVE ENGAGED. Accent bus rerouted."}</Ok>;
    },
  },
};

interface Line {
  id: number;
  cwd?: string;
  input?: string;
  out?: Out;
}

let lineSeq = 0;

export default function Terminal({ win }: AppProps) {
  const os = useOS();
  const settings = useSettings();
  const [cwd, setCwd] = useState("desktop");
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: ++lineSeq,
      out: (
        <div className="t-welcome">
          <Ok>iratanshOS · ish 1.0</Ok>
          <Dim>A simulated shell for exploring this portfolio. It has no access to your computer.</Dim>
          <span>
            Type <span className="t-cmd">help</span> to begin, or try <span className="t-cmd">open projects</span>.
          </span>
        </div>
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("terminal_open");
  }, []);
  useEffect(() => {
    if (os.focusId === win.id) inputRef.current?.focus({ preventScroll: true });
  }, [os.focusId, win.id]);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const text = raw.trim();
    const entry: Line = { id: ++lineSeq, cwd, input: raw };
    if (!text) return setLines((l) => [...l, entry]);
    const [name, ...args] = text.split(/\s+/);
    const cmd = COMMANDS[name.toLowerCase()];
    setHist((h) => [...h, text].slice(-100));
    setHi(-1);
    if (cmd) track("terminal_command", { command: name.toLowerCase() });
    let cleared = false;
    const out = cmd ? (
      cmd.run(args, {
        os,
        settings,
        cwd,
        setCwd,
        history: [...hist, text],
        clear: () => (cleared = true),
        close: () => os.close(win.id),
      })
    ) : (
      <Err>ish: command not found: {name}. Try `help`.</Err>
    );
    if (cleared) return setLines([]);
    setLines((l) => [...l, { ...entry, out }]);
  };

  const complete = () => {
    const parts = input.split(/\s+/);
    if (parts.length === 1) {
      const m = Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden && k.startsWith(parts[0].toLowerCase()));
      if (m.length === 1) setInput(m[0] + " ");
      else if (m.length > 1) setLines((l) => [...l, { id: ++lineSeq, cwd, input, out: <Dim>{m.join("  ")}</Dim> }]);
      return;
    }
    const last = parts.slice(1).join(" ").toLowerCase();
    const pool = [...listFolder(cwd).map((n) => n.name), ...Object.keys(OPEN_ALIASES)];
    const m = [...new Set(pool.filter((n) => n.toLowerCase().startsWith(last)))];
    if (m.length === 1) setInput(`${parts[0]} ${m[0]}`);
    else if (m.length > 1) setLines((l) => [...l, { id: ++lineSeq, cwd, input, out: <Dim>{m.join("  ")}</Dim> }]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = hi < 0 ? hist.length - 1 : Math.max(0, hi - 1);
      if (hist[i] !== undefined) {
        setHi(i);
        setInput(hist[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hi < 0) return;
      const i = hi + 1;
      if (i >= hist.length) {
        setHi(-1);
        setInput("");
      } else {
        setHi(i);
        setInput(hist[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      setLines((l) => [...l, { id: ++lineSeq, cwd, input: input + "^C" }]);
      setInput("");
    }
  };

  const Prompt = ({ at }: { at: string }) => (
    <span className="t-prompt">
      <span className="t-user">visitor@iratanshos</span> <span className="t-path">{unixPath(at)}</span> <span className="t-sigil">$</span>
    </span>
  );

  return (
    <div className="term force-dark" onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus()}>
      <div className="term-body" ref={bodyRef} role="log" aria-live="polite">
        {lines.map((l) => (
          <div key={l.id} className="t-line">
            {l.input !== undefined && (
              <div>
                <Prompt at={l.cwd!} /> {l.input}
              </div>
            )}
            {l.out !== undefined && l.out !== null && <div className="t-out">{l.out}</div>}
          </div>
        ))}
        <div className="t-input-line">
          <Prompt at={cwd} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            aria-label="Terminal input"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </div>
  );
}
