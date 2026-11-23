import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNexus } from "../../lib/nexus";
import { moduleById } from "../../lib/routes";
import { Icon } from "../ui/Icon";
import { commands, completions, type CommandContext } from "./commands";
import { track } from "../../analytics";

interface Entry {
  id: number;
  input?: string;
  cwd?: string;
  output: ReactNode;
}

const Banner = () => (
  <div className="t-banner">
    <pre className="t-logo">{`█▄ █ █▀▀ ▀▄▀ █ █ █▀
█ ▀█ ██▄ █ █ █▄█ ▄█`}</pre>
    <div className="t-dim">ish 1.0: an interactive shell for this site. Type `help` to begin.</div>
  </div>
);

export function Terminal() {
  const nexus = useNexus();
  const { terminalOpen, setTerminalOpen, route, navigate, session, bumpCommands, setOverdrive, overdrive, cycleMotion } = nexus;
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, output: <Banner /> }]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  const cwd = moduleById[route.module].path + (route.param ? `/${route.param}` : "");

  useEffect(() => {
    if (!terminalOpen) return;
    track("terminal_open");
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }, [terminalOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  const run = (raw: string) => {
    const line = raw.trim();
    const id = idRef.current++;
    if (!line) {
      setEntries((e) => [...e, { id, input: "", cwd, output: null }]);
      return;
    }
    const nextHistory = [...history, line];
    setHistory(nextHistory);
    setHIdx(null);
    bumpCommands();
    const [name, ...args] = line.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    // Only the command name is recorded, never arguments or free text.
    track("terminal_command", { command: cmd ? name.toLowerCase() : "unknown" });
    let cleared = false;
    const ctx: CommandContext = {
      navigate,
      route,
      clear: () => {
        cleared = true;
        setEntries([]);
      },
      close: () => setTerminalOpen(false),
      history: nextHistory,
      sessionStart: session.startedAt,
      setOverdrive,
      overdrive,
      cycleMotion,
    };
    const output = cmd ? (
      cmd.run(args, ctx)
    ) : (
      <span className="t-err">
        ish: command not found: {name}. <span className="t-dim">Try `help`.</span>
      </span>
    );
    if (!cleared) setEntries((e) => [...e.slice(-80), { id, input: line, cwd, output }]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = hIdx === null ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === null) return;
      const i = hIdx + 1;
      if (i >= history.length) {
        setHIdx(null);
        setInput("");
      } else {
        setHIdx(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const opts = completions(input.trimStart());
      if (opts.length === 1) setInput(opts[0] + " ");
      else if (opts.length > 1) {
        setEntries((en) => [
          ...en,
          { id: idRef.current++, input, cwd, output: <div className="t-cols">{opts.map((o) => <span key={o}>{o.split(" ").pop()}</span>)}</div> },
        ]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setEntries((en) => [...en, { id: idRef.current++, input: input + "^C", cwd, output: null }]);
      setInput("");
    } else if (e.key === "Escape") {
      setTerminalOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.section
          className="terminal"
          role="dialog"
          aria-label="Terminal"
          initial={{ y: "100%", opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="terminal-bar">
            <span className="label">
              <Icon name="terminal" size={12} /> ish <span className="dim">· {cwd}</span>
            </span>
            <span className="terminal-hint label">
              <span className="kbd">esc</span> close
            </span>
            <button onClick={() => setTerminalOpen(false)} aria-label="Close terminal" className="terminal-close">
              <Icon name="close" size={12} />
            </button>
          </header>
          <div className="terminal-body mono" ref={scrollRef} onClick={() => inputRef.current?.focus()}>
            {entries.map((en) => (
              <div key={en.id} className="t-entry">
                {en.input !== undefined && (
                  <div className="t-prompt-line">
                    <Prompt cwd={en.cwd ?? "~"} /> <span>{en.input}</span>
                  </div>
                )}
                {en.output !== null && en.output !== undefined && <div className="t-out">{en.output}</div>}
              </div>
            ))}
            <div className="t-prompt-line t-live">
              <Prompt cwd={cwd} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Terminal input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Prompt({ cwd }: { cwd: string }) {
  return (
    <span className="t-prompt" aria-hidden="true">
      <span className="t-user">visitor@iratansh</span>
      <span className="t-dim">:</span>
      <span className="t-cwd">{cwd}</span>
      <span className="t-dim">$</span>
    </span>
  );
}
