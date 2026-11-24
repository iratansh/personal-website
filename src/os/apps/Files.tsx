import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { getNode, listFolder, pathOf } from "../fs";
import { useOS } from "../store";
import { formatDate, useIsMobile } from "../hooks";
import { AppIcon } from "../ui/AppIcon";
import { itemMenu } from "../shell/desktopLayout";
import type { AppProps, FsNode } from "../types";

const SIDEBAR: { group: string; ids: string[] }[] = [
  { group: "Favorites", ids: ["desktop", "projects", "opensource", "documents"] },
  { group: "Library", ids: ["notes", "experiments", "applications", "system"] },
];

type SortKey = "name" | "kind" | "modified";

export default function Files({ win, arg }: AppProps) {
  const os = useOS();
  const mobile = useIsMobile();
  const start = arg && getNode(arg)?.kind === "folder" ? arg : "desktop";
  const [hist, setHist] = useState({ stack: [start], i: 0 });
  const cwd = hist.stack[hist.i];
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [q, setQ] = useState("");
  const view = os.filesView[win.id] ?? (cwd === "projects" || cwd === "opensource" ? "list" : "grid");
  const contentRef = useRef<HTMLDivElement>(null);

  // Keep the window title and URL in step with the current folder.
  useEffect(() => {
    if (cwd !== win.arg) os.setArg(win.id, cwd);
  }, [cwd]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (id: string) => {
    if (id === cwd) return;
    setHist((h) => ({ stack: [...h.stack.slice(0, h.i + 1), id], i: h.i + 1 }));
    setSelected(null);
    setQ("");
  };
  const back = () => hist.i > 0 && setHist((h) => ({ ...h, i: h.i - 1 }));
  const fwd = () => hist.i < hist.stack.length - 1 && setHist((h) => ({ ...h, i: h.i + 1 }));
  const activate = (n: FsNode) => (n.kind === "folder" ? go(n.id) : os.open(n.id, { source: "files" }));

  const items = useMemo(() => {
    let list = listFolder(cwd);
    const needle = q.trim().toLowerCase();
    if (needle)
      list = list.filter((n) => [n.name, n.kindLabel, n.description ?? "", ...(n.keywords ?? [])].some((s) => s.toLowerCase().includes(needle)));
    if (sort) {
      const val = (n: FsNode) => (sort.key === "name" ? n.name.toLowerCase() : sort.key === "kind" ? n.kindLabel : n.modified ?? "");
      list = [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir);
    }
    return list;
  }, [cwd, q, sort]);

  const sel = selected ? getNode(selected) : undefined;
  const crumbs = pathOf(cwd);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const i = items.findIndex((n) => n.id === selected);
    const step = view === "grid" ? Math.max(1, Math.floor((contentRef.current?.clientWidth ?? 600) / 112)) : 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" && view === "grid") next = i + 1;
    if (e.key === "ArrowLeft" && view === "grid") next = i - 1;
    if (e.key === "ArrowDown") next = i < 0 ? 0 : i + step;
    if (e.key === "ArrowUp") next = i - step;
    if (next !== null) {
      e.preventDefault();
      const n = items[Math.max(0, Math.min(items.length - 1, next))];
      if (n) {
        setSelected(n.id);
        contentRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(n.id)}"]`)?.focus();
      }
    }
    if (e.key === "Enter" && sel) activate(sel);
    if (e.key === "Backspace" || (e.metaKey && e.key === "[")) back();
    if (e.metaKey && e.key === "]") fwd();
  };

  const ctx = (n: FsNode) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(n.id);
    const base = itemMenu(os, n.id);
    os.openMenu(
      e.clientX,
      e.clientY,
      n.kind === "folder"
        ? [{ label: "Open", onSelect: () => go(n.id) }, { label: "Open in New Window", onSelect: () => os.open(n.id) }, ...base.slice(1)]
        : base,
    );
  };

  const headerSort = (key: SortKey) => setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  const SortIcon = ({ k }: { k: SortKey }) => (sort?.key === k ? sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : null);

  return (
    <div className="files" onKeyDown={onKey}>
      {!mobile && (
        <aside className="files-side" aria-label="Places">
          {SIDEBAR.map((g) => (
            <div key={g.group}>
              <div className="files-side-h">{g.group}</div>
              {g.ids.map((id) => {
                const n = getNode(id)!;
                return (
                  <button key={id} className={`files-side-item${cwd === id ? " is-active" : ""}`} onClick={() => go(id)}>
                    <AppIcon spec={n.icon} size={18} />
                    {n.name}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
      )}
      <div className="files-main">
        <div className="files-toolbar">
          <div className="seg">
            <button onClick={back} disabled={hist.i === 0} aria-label="Back">
              <ChevronLeft size={16} />
            </button>
            <button onClick={fwd} disabled={hist.i >= hist.stack.length - 1} aria-label="Forward">
              <ChevronRight size={16} />
            </button>
          </div>
          <nav className="crumbs" aria-label="Path">
            {crumbs.map((c, i) => (
              <span key={c.id} className="crumb">
                {i > 0 && <span className="crumb-sep">/</span>}
                <button onClick={() => go(c.id)} aria-current={i === crumbs.length - 1 ? "location" : undefined}>
                  {c.name}
                </button>
              </span>
            ))}
          </nav>
          <div className="seg" role="group" aria-label="View">
            <button aria-pressed={view === "grid"} onClick={() => os.setFilesView(win.id, "grid")} aria-label="Icons" title="as Icons">
              <LayoutGrid size={14} />
            </button>
            <button aria-pressed={view === "list"} onClick={() => os.setFilesView(win.id, "list")} aria-label="List" title="as List">
              <List size={15} />
            </button>
          </div>
          <label className="files-search">
            <Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" aria-label="Filter this folder" />
          </label>
        </div>

        <div
          className={`files-content view-${view}`}
          ref={contentRef}
          onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
          role={view === "list" ? "grid" : "listbox"}
          aria-label={getNode(cwd)?.name}
        >
          {items.length === 0 && <p className="files-empty">{q ? `Nothing here matches “${q}”.` : "This folder is empty."}</p>}
          {view === "list" && items.length > 0 && (
            <div className="fl-row fl-head" role="row">
              <button role="columnheader" onClick={() => headerSort("name")}>
                Name <SortIcon k="name" />
              </button>
              <button role="columnheader" onClick={() => headerSort("kind")}>
                Kind <SortIcon k="kind" />
              </button>
              <button role="columnheader" onClick={() => headerSort("modified")}>
                Date <SortIcon k="modified" />
              </button>
            </div>
          )}
          {items.map((n) =>
            view === "grid" ? (
              <button
                key={n.id}
                data-id={n.id}
                className={`fg-item${selected === n.id ? " is-selected" : ""}`}
                role="option"
                aria-selected={selected === n.id}
                onClick={() => (mobile ? activate(n) : setSelected(n.id))}
                onDoubleClick={() => activate(n)}
                onContextMenu={ctx(n)}
                title={n.description}
              >
                <AppIcon spec={n.icon} size={54} locked={n.locked} />
                <span className="fg-name">{n.name}</span>
              </button>
            ) : (
              <button
                key={n.id}
                data-id={n.id}
                className={`fl-row fl-item${selected === n.id ? " is-selected" : ""}`}
                role="row"
                aria-selected={selected === n.id}
                onClick={() => (mobile ? activate(n) : setSelected(n.id))}
                onDoubleClick={() => activate(n)}
                onContextMenu={ctx(n)}
              >
                <span className="fl-name" role="gridcell">
                  <AppIcon spec={n.icon} size={20} locked={n.locked} />
                  <span>
                    {n.name}
                    {n.description && <em>{n.description}</em>}
                  </span>
                </span>
                <span className="fl-kind" role="gridcell">
                  {n.kindLabel}
                </span>
                <span className="fl-date" role="gridcell">
                  {formatDate(n.modified)}
                </span>
              </button>
            ),
          )}
        </div>

        <footer className="files-status">
          {sel ? (
            <>
              <strong>{sel.name}</strong>
              <span>{sel.description ?? sel.kindLabel}</span>
            </>
          ) : (
            <span>
              {items.length} item{items.length === 1 ? "" : "s"}
              {!mobile && " · double-click to open"}
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}
