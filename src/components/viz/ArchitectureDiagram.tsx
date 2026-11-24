import { useId, useState } from "react";
import type { ArchEdge, ArchNode } from "../../data/types";

const W = 150;
const H = 56;
const GY = 38;
const PAD = 14;

const TONE: Record<NonNullable<ArchNode["tone"]>, string> = {
  client: "var(--tone-client, #aab7b3)",
  service: "var(--tone-service, #34e0a1)",
  store: "var(--tone-store, #5ad8ff)",
  queue: "var(--tone-queue, #ffbf5e)",
  external: "var(--tone-external, #a68bff)",
  observe: "var(--tone-observe, #6b98ff)",
};

const TONE_LABEL: Record<NonNullable<ArchNode["tone"]>, string> = {
  client: "client",
  service: "service",
  store: "storage",
  queue: "queue",
  external: "external",
  observe: "telemetry",
};

interface Props {
  nodes: ArchNode[];
  edges: ArchEdge[];
  /** Decorative, scaled-to-fit preview: no legend, no hover, hidden from assistive tech. */
  thumbnail?: boolean;
  /** Makes components clickable; the selected one stays highlighted like a hover. */
  selected?: string | null;
  onSelect?: (id: string) => void;
}

export function ArchitectureDiagram({ nodes, edges, thumbnail = false, selected = null, onSelect }: Props) {
  const uid = useId().replace(/:/g, "");
  const [hoverState, setHover] = useState<string | null>(null);
  const hover = hoverState ?? selected;
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const GX = cols >= 5 ? 70 : 96; // wide pipelines get tighter gutters so text stays legible
  const width = PAD * 2 + cols * W + (cols - 1) * GX;
  const height = PAD * 2 + rows * H + (rows - 1) * GY;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const box = (n: ArchNode) => ({ x: PAD + n.col * (W + GX), y: PAD + n.row * (H + GY) });

  const route = (e: ArchEdge) => {
    const a = byId[e.from];
    const b = byId[e.to];
    const A = box(a);
    const B = box(b);
    if (a.col === b.col) {
      const down = b.row > a.row;
      const x = A.x + W / 2;
      const y1 = down ? A.y + H : A.y;
      const y2 = down ? B.y - 4 : B.y + H + 4;
      return { d: `M${x},${y1} V${y2}`, mx: x, my: (y1 + y2) / 2 };
    }
    const forward = b.col > a.col;
    const x1 = forward ? A.x + W : A.x;
    const x2 = forward ? B.x - 4 : B.x + W + 4;
    const y1 = A.y + H / 2;
    const y2 = B.y + H / 2;
    if (y1 === y2) return { d: `M${x1},${y1} H${x2}`, mx: (x1 + x2) / 2, my: y1 };
    const r = 6;
    if (!forward) {
      // Backward edges leave vertically so they don't collide with inbound edges.
      const vx = A.x + W / 2;
      const up = b.row < a.row;
      const vy1 = up ? A.y : A.y + H;
      const sy = up ? -r : r;
      return {
        d: `M${vx},${vy1} V${y2 - sy} Q${vx},${y2} ${vx - r},${y2} H${x2}`,
        mx: (vx + x2) / 2,
        my: y2,
      };
    }
    const mx = x1 + GX / 2;
    const dy = y2 > y1 ? r : -r;
    const dx = forward ? r : -r;
    return {
      d: `M${x1},${y1} H${mx - dx} Q${mx},${y1} ${mx},${y1 + dy} V${y2 - dy} Q${mx},${y2} ${mx + dx},${y2} H${x2}`,
      mx,
      my: (y1 + y2) / 2,
    };
  };

  const tones = [...new Set(nodes.map((n) => n.tone ?? "service"))];

  return (
    <div className={thumbnail ? "arch arch-thumb" : "arch"} aria-hidden={thumbnail || undefined}>
      <div className="arch-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={thumbnail ? undefined : width}
          className="arch-svg"
          role={thumbnail ? undefined : "img"}
          aria-label={
            thumbnail
              ? undefined
              : `Architecture: ${edges.map((e) => `${byId[e.from].label} to ${byId[e.to].label}`).join("; ")}`
          }
        >
          <defs>
            <marker id={`ah-${uid}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0.5 L7,4 L0,7.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </marker>
            <pattern id={`grid-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M12 0H0V12" fill="none" className="arch-grid" />
            </pattern>
          </defs>
          <rect width={width} height={height} fill={`url(#grid-${uid})`} />

          {edges.map((e, i) => {
            const { d, mx, my } = route(e);
            const lit = hover === e.from || hover === e.to;
            const dim = hover && !lit;
            return (
              <g key={i} className={`arch-edge${lit ? " lit" : ""}`} style={{ opacity: dim ? 0.25 : 1 }}>
                <path d={d} className="arch-edge-base" markerEnd={`url(#ah-${uid})`} />
                <path d={d} className="arch-edge-flow" />
                {e.label && (
                  <g transform={`translate(${mx},${my})`}>
                    <rect
                      x={-(e.label.length * 3.1 + 6)}
                      y={-8}
                      width={e.label.length * 6.2 + 12}
                      height={16}
                      className="arch-edge-label-bg"
                    />
                    <text className="arch-edge-label" textAnchor="middle" dy="3.5">
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {nodes.map((n) => {
            const { x, y } = box(n);
            const c = TONE[n.tone ?? "service"];
            const dim = hover && hover !== n.id && !edges.some((e) => (e.from === hover && e.to === n.id) || (e.to === hover && e.from === n.id));
            return (
              <g
                key={n.id}
                transform={`translate(${x},${y})`}
                className={`arch-node${selected === n.id ? " is-selected" : ""}`}
                onMouseEnter={thumbnail ? undefined : () => setHover(n.id)}
                onMouseLeave={thumbnail ? undefined : () => setHover(null)}
                onClick={onSelect ? () => onSelect(n.id) : undefined}
                onKeyDown={onSelect ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(n.id)) : undefined}
                tabIndex={onSelect ? 0 : undefined}
                role={onSelect ? "button" : undefined}
                aria-label={onSelect ? `${n.label}${n.sub ? `, ${n.sub}` : ""}` : undefined}
                aria-pressed={onSelect ? selected === n.id : undefined}
                style={{ opacity: dim ? 0.35 : 1, cursor: onSelect ? "pointer" : undefined }}
              >
                <rect width={W} height={H} className="arch-node-bg" />
                <rect width={2} height={H} style={{ fill: c }} />
                <path d={`M${W - 8},0 H${W} V8`} style={{ stroke: c }} fill="none" opacity="0.6" />
                <text x={14} y={n.sub ? 23 : 32} className="arch-node-label">
                  {n.label}
                </text>
                {n.sub && (
                  <text x={14} y={40} className="arch-node-sub">
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {!thumbnail && <div className="arch-legend">
        {tones.map((t) => (
          <span key={t} className="label">
            <i style={{ background: TONE[t] }} /> {TONE_LABEL[t]}
          </span>
        ))}
      </div>}
    </div>
  );
}
