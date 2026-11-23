import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type Simulation,
} from "d3-force";
import { useNexus } from "../../lib/nexus";
import { useActive, useSize } from "../../lib/hooks";
import { domains } from "../../data/domains";
import { profile } from "../../data/profile";
import { Icon } from "../ui/Icon";
import { track } from "../../analytics";
import { buildTopology, kindLabel, type TopoLink, type TopoNode } from "./topologyData";

const MONO = '"Geist Mono", ui-monospace, monospace';
const SANS = '"Geist", system-ui, sans-serif';

const endpoints = (l: TopoLink) => [l.source as TopoNode, l.target as TopoNode] as const;

/** Orbit geometry shared by physics and rendering; tighter on narrow screens. */
function geometry(w: number, h: number) {
  const R = Math.min(w, h * 1.15);
  const narrow = w < 520;
  return { R, narrow, r1: R * (narrow ? 0.19 : 0.22), r2: R * (narrow ? 0.34 : 0.41) };
}

function hitRadius(n: TopoNode) {
  return n.kind === "core" ? 36 : n.kind === "domain" ? 26 : 20;
}

export default function Topology() {
  const { reducedMotion, navigate } = useNexus();
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useActive(wrapRef);
  const graph = useMemo(buildTopology, []);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const simRef = useRef<Simulation<TopoNode, TopoLink> | null>(null);
  const live = useRef({
    hovered: null as string | null,
    selected: null as string | null,
    dirty: true,
    drag: null as null | { node: TopoNode; sx: number; sy: number; moved: boolean },
  });

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      if (!map.has(a)) map.set(a, new Set([a]));
      map.get(a)!.add(b);
    };
    for (const l of graph.links) {
      const s = typeof l.source === "string" ? l.source : l.source.id;
      const t = typeof l.target === "string" ? l.target : l.target.id;
      add(s, t);
      add(t, s);
    }
    return map;
  }, [graph]);

  useEffect(() => {
    if (selected) track("topology_select", { node: selected });
  }, [selected]);

  useEffect(() => {
    live.current.hovered = hovered;
    live.current.selected = selected;
    live.current.dirty = true;
  }, [hovered, selected]);

  /* --- Physics --- */
  useEffect(() => {
    if (!size.width || !size.height) return;
    const { r1, r2 } = geometry(size.width, size.height);

    graph.nodes.forEach((n, i) => {
      if (n.x !== undefined) return;
      if (n.kind === "core") {
        n.x = 0;
        n.y = 0;
      } else if (n.kind === "domain") {
        const k = domains.findIndex((d) => `d:${d.id}` === n.id);
        const a = (k / domains.length) * Math.PI * 2 - Math.PI / 2;
        n.x = Math.cos(a) * r1;
        n.y = Math.sin(a) * r1;
      } else {
        const a = i * 2.39996; // golden angle spread
        n.x = Math.cos(a) * r2;
        n.y = Math.sin(a) * r2;
      }
    });
    const core = graph.nodes[0];
    core.fx = 0;
    core.fy = 0;

    const sim = forceSimulation<TopoNode, TopoLink>(graph.nodes)
      .force(
        "link",
        forceLink<TopoNode, TopoLink>(graph.links)
          .id((d) => d.id)
          .distance((l) => (l.kind === "spine" ? r1 : (r2 - r1) * 1.05))
          .strength((l) => (l.kind === "spine" ? 0.5 : 0.06)),
      )
      .force("charge", forceManyBody<TopoNode>().strength((d) => (d.kind === "domain" ? -320 : d.kind === "core" ? 0 : -110)))
      .force(
        "radial",
        forceRadial<TopoNode>((d) => (d.kind === "core" ? 0 : d.kind === "domain" ? r1 : r2), 0, 0).strength((d) =>
          d.kind === "domain" ? 0.7 : 0.35,
        ),
      )
      .force("collide", forceCollide<TopoNode>((d) => (d.kind === "core" ? 46 : d.kind === "domain" ? 30 : 18)))
      .alphaDecay(0.025)
      .on("tick", () => {
        live.current.dirty = true;
      });
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [graph, size.width, size.height]);

  /* --- Render --- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !active) return;
    const w = size.width;
    const h = size.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const packets = graph.links.map((_, i) => ({ phase: (i * 0.618) % 1, speed: 0.12 + ((i * 37) % 10) / 70 }));
    const t0 = performance.now();
    const geo = geometry(w, h);
    const showAllLabels = w > 460;
    let raf = 0;
    live.current.dirty = true;

    const pos = (n: TopoNode, t: number, i: number) => {
      if (reducedMotion || n.kind === "core") return [n.x ?? 0, n.y ?? 0] as const;
      const amp = n.kind === "domain" ? 1.2 : 2.2;
      return [(n.x ?? 0) + Math.sin(t * 0.5 + i * 1.7) * amp, (n.y ?? 0) + Math.cos(t * 0.43 + i * 1.3) * amp] as const;
    };

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const st = live.current;
      if (reducedMotion && !st.dirty) return;
      st.dirty = false;
      const t = (now - t0) / 1000;
      const focusId = st.hovered ?? st.selected;
      const focus = focusId ? neighbors.get(focusId) : null;
      const P = new Map<string, readonly [number, number]>();
      graph.nodes.forEach((n, i) => P.set(n.id, pos(n, t, i)));

      ctx.setTransform(dpr, 0, 0, dpr, (w / 2) * dpr, (h / 2) * dpr);
      ctx.clearRect(-w / 2, -h / 2, w, h);

      // Orbit guides
      const R = geo.R;
      ctx.lineWidth = 1;
      for (const [r, a] of [
        [geo.r1, 0.09],
        [geo.r2, 0.06],
        [geo.r2 * 1.22, 0.035],
      ] as const) {
        ctx.strokeStyle = `rgba(150,220,200,${a})`;
        ctx.setLineDash([2, 6]);
        ctx.lineDashOffset = reducedMotion ? 0 : -t * 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Crosshair ticks
      ctx.strokeStyle = "rgba(150,220,200,0.08)";
      ctx.beginPath();
      ctx.moveTo(-R * 0.56, 0);
      ctx.lineTo(-R * 0.52, 0);
      ctx.moveTo(R * 0.52, 0);
      ctx.lineTo(R * 0.56, 0);
      ctx.moveTo(0, -R * 0.56);
      ctx.lineTo(0, -R * 0.52);
      ctx.moveTo(0, R * 0.52);
      ctx.lineTo(0, R * 0.56);
      ctx.stroke();

      // Edges
      graph.links.forEach((l, i) => {
        const [s, tg] = endpoints(l);
        const a = P.get(s.id)!;
        const b = P.get(tg.id)!;
        const lit = focus ? focus.has(s.id) && focus.has(tg.id) && (s.id === focusId || tg.id === focusId || l.kind === "spine") : false;
        const litStrict = focus ? s.id === focusId || tg.id === focusId : false;
        const hue = tg.kind === "domain" ? tg.hue : s.hue;
        const cx = ((a[0] + b[0]) / 2) * (l.kind === "leaf" ? 0.82 : 1);
        const cy = ((a[1] + b[1]) / 2) * (l.kind === "leaf" ? 0.82 : 1);

        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.quadraticCurveTo(cx, cy, b[0], b[1]);
        if (focus && (litStrict || lit)) {
          ctx.strokeStyle = hue;
          ctx.globalAlpha = litStrict ? 0.75 : 0.35;
          ctx.lineWidth = 1.2;
        } else {
          ctx.strokeStyle = l.kind === "spine" ? "rgba(150,220,200,0.2)" : "rgba(150,220,200,0.09)";
          ctx.globalAlpha = focus ? 0.35 : 1;
          ctx.lineWidth = 1;
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Packets: data flows inward, from work → domain → core
        if (!reducedMotion && (!focus || litStrict)) {
          const p = packets[i];
          const u = (t * p.speed + p.phase) % 1;
          const iu = 1 - u;
          const px = iu * iu * a[0] + 2 * iu * u * cx + u * u * b[0];
          const py = iu * iu * a[1] + 2 * iu * u * cy + u * u * b[1];
          const fade = Math.sin(u * Math.PI);
          ctx.fillStyle = hue;
          ctx.globalAlpha = 0.14 * fade * (litStrict ? 2 : 1);
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.9 * fade;
          ctx.beginPath();
          ctx.arc(px, py, 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // Nodes
      ctx.textBaseline = "middle";
      graph.nodes.forEach((n) => {
        const [x, y] = P.get(n.id)!;
        const isFocus = n.id === focusId;
        const dim = focus ? !focus.has(n.id) : false;
        ctx.globalAlpha = dim ? 0.22 : 1;

        if (n.kind === "core") {
          const pulse = reducedMotion ? 0 : (t % 3.2) / 3.2;
          if (pulse) {
            ctx.strokeStyle = n.hue;
            ctx.globalAlpha = (1 - pulse) * 0.35;
            ctx.beginPath();
            ctx.arc(x, y, 26 + pulse * 46, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          const g = ctx.createRadialGradient(x, y, 0, x, y, 70);
          g.addColorStop(0, "rgba(52,224,161,0.16)");
          g.addColorStop(1, "rgba(52,224,161,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 70, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(90,216,255,0.5)";
          ctx.setLineDash([3, 5]);
          ctx.lineDashOffset = reducedMotion ? 0 : t * 8;
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#080b0d";
          ctx.strokeStyle = n.hue;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
            const vx = x + Math.cos(a) * 25;
            const vy = y + Math.sin(a) * 25;
            if (k === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.fillStyle = "#e9f0ee";
          ctx.font = `600 13px ${MONO}`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, x, y + 0.5);
        } else if (n.kind === "domain") {
          ctx.fillStyle = "#080b0d";
          ctx.strokeStyle = n.hue;
          ctx.lineWidth = isFocus ? 1.6 : 1.2;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = n.hue;
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = n.hue;
          ctx.globalAlpha = (dim ? 0.1 : 0.28) + (isFocus ? 0.4 : 0);
          ctx.beginPath();
          ctx.arc(x, y, isFocus ? 15 : 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = dim ? 0.22 : 1;
          ctx.lineWidth = 1;

          const ang = Math.atan2(y, x);
          const lx = x + Math.cos(ang) * 22;
          const ly = y + Math.sin(ang) * 22;
          ctx.textAlign = Math.abs(Math.cos(ang)) < 0.3 ? "center" : Math.cos(ang) > 0 ? "left" : "right";
          ctx.font = `500 10.5px ${MONO}`;
          ctx.fillStyle = isFocus ? n.hue : "#c6d1ce";
          ctx.fillText(geo.narrow ? n.sub : n.label.toUpperCase(), lx, ly + (Math.abs(Math.cos(ang)) < 0.3 ? Math.sign(Math.sin(ang)) * 4 : 0));
        } else {
          ctx.fillStyle = "#080b0d";
          ctx.strokeStyle = n.hue;
          ctx.lineWidth = isFocus ? 1.6 : 1.1;
          ctx.beginPath();
          if (n.kind === "project") {
            ctx.rect(x - 4.5, y - 4.5, 9, 9);
          } else if (n.kind === "role") {
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x + 6, y);
            ctx.lineTo(x, y + 6);
            ctx.lineTo(x - 6, y);
            ctx.closePath();
          } else {
            ctx.arc(x, y, 4.2, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.stroke();
          ctx.lineWidth = 1;

          const showLabel = isFocus || (focus ? focus.has(n.id) : showAllLabels);
          if (showLabel) {
            ctx.font = `${isFocus ? 500 : 400} 11.5px ${SANS}`;
            ctx.fillStyle = isFocus ? "#e9f0ee" : focus ? "#c6d1ce" : "rgba(170,183,179,0.7)";
            // Labels point outward; flip inward if they'd run off the canvas, else ellipsize.
            const EDGE = 8;
            const roomOut = x >= 0 ? w / 2 - EDGE - (x + 11) : x - 11 - (-w / 2 + EDGE);
            const roomIn = x >= 0 ? x - 11 - (-w / 2 + EDGE) : w / 2 - EDGE - (x + 11);
            const width = ctx.measureText(n.label).width;
            const outward = width <= roomOut || roomOut >= roomIn;
            const right = outward ? x >= 0 : x < 0;
            let text = n.label;
            const room = outward ? roomOut : roomIn;
            if (width > room) {
              while (text.length > 1 && ctx.measureText(text + "…").width > room) text = text.slice(0, -1);
              text = text.trimEnd() + "…";
            }
            ctx.textAlign = right ? "left" : "right";
            ctx.fillText(text, x + (right ? 11 : -11), y + 0.5);
          }
        }
        ctx.globalAlpha = 1;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, size.width, size.height, reducedMotion, graph, neighbors]);

  /* --- Interaction --- */
  const toLocal = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2] as const;
  };
  const hit = (x: number, y: number) => {
    let best: TopoNode | null = null;
    let bestD = Infinity;
    for (const n of graph.nodes) {
      const d = Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y);
      if (d < hitRadius(n) && d < bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const [x, y] = toLocal(e);
    const n = hit(x, y);
    if (!n) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    live.current.drag = { node: n, sx: x, sy: y, moved: false };
    if (n.kind !== "core") canvasRef.current!.style.cursor = "grabbing";
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const [x, y] = toLocal(e);
    const drag = live.current.drag;
    if (drag) {
      if (!drag.moved && Math.hypot(x - drag.sx, y - drag.sy) > 5) drag.moved = true;
      if (drag.moved && drag.node.kind !== "core") {
        const rect = canvasRef.current!.getBoundingClientRect();
        drag.node.fx = Math.max(-rect.width / 2 + 16, Math.min(rect.width / 2 - 16, x));
        drag.node.fy = Math.max(-rect.height / 2 + 16, Math.min(rect.height / 2 - 16, y));
        simRef.current?.alphaTarget(0.25).restart();
      }
      return;
    }
    const n = hit(x, y);
    const id = n?.id ?? null;
    if (id !== live.current.hovered) setHovered(id);
    canvasRef.current!.style.cursor = !n ? "default" : n.kind === "core" ? "pointer" : "grab";
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const drag = live.current.drag;
    live.current.drag = null;
    if (drag) {
      // A dragged node stays where it's dropped; the rest of the graph settles around it.
      simRef.current?.alphaTarget(0);
      if (drag.node.kind !== "core") canvasRef.current!.style.cursor = "grab";
      if (!drag.moved) setSelected((s) => (s === drag.node.id ? null : drag.node.id));
      return;
    }
    const [x, y] = toLocal(e);
    if (!hit(x, y)) setSelected(null);
  };

  const sel = graph.nodes.find((n) => n.id === selected) ?? null;
  const related = sel
    ? graph.nodes.filter((n) => n.id !== sel.id && neighbors.get(sel.id)?.has(n.id) && n.kind !== "core")
    : [];

  return (
    <div className="topo">
      <div
        className="topo-stage frame"
        ref={wrapRef}
        onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
      >
        <canvas
          ref={canvasRef}
          className="topo-canvas"
          role="img"
          aria-label="Interactive network map connecting six engineering domains to projects, roles, and lab entries. Use the domain buttons below to explore with a keyboard."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => {
            if (!live.current.drag) setHovered(null);
          }}
        />
        <div className="topo-hud topo-hud-tl label">
          <span className="accent">●</span> Topology · interest graph
        </div>
        <div className="topo-hud topo-hud-tr label">
          {graph.nodes.length} nodes · {graph.links.length} edges
        </div>
        <div className="topo-hud topo-hud-br label">drag · click · esc</div>
        <div className="topo-legend label" aria-hidden="true">
          <span>
            <i className="lg lg-sq" /> service
          </span>
          <span>
            <i className="lg lg-di" /> role
          </span>
          <span>
            <i className="lg lg-ci" /> lab
          </span>
        </div>

        <AnimatePresence>
          {sel && (
            <motion.div
              key={sel.id}
              className="topo-inspector"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label={`${sel.label} details`}
            >
              <div className="topo-insp-head">
                <span className="label" style={{ color: sel.hue }}>
                  {kindLabel(sel)}
                </span>
                <button onClick={() => setSelected(null)} aria-label="Close details" className="topo-insp-close">
                  <Icon name="close" size={12} />
                </button>
              </div>
              <h3>{sel.kind === "core" ? profile.name : sel.label}</h3>
              <p>
                {sel.kind === "domain"
                  ? domains.find((d) => `d:${d.id}` === sel.id)?.description
                  : sel.kind === "core"
                    ? profile.intro
                    : sel.sub}
              </p>
              {sel.route && (
                <button className="link-arrow" onClick={() => navigate(sel.route!)}>
                  Open {kindLabel(sel).toLowerCase()} <Icon name="arrowRight" />
                </button>
              )}
              {related.length > 0 && (
                <>
                  <div className="label topo-insp-sub">Linked · {related.length}</div>
                  <ul className="topo-insp-list">
                    {related.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => (r.kind === "domain" ? setSelected(r.id) : r.route && navigate(r.route))}
                        >
                          <i className={`lg ${r.kind === "project" ? "lg-sq" : r.kind === "role" ? "lg-di" : r.kind === "lab" ? "lg-ci" : "lg-dom"}`} style={{ color: r.hue }} />
                          <span>{r.label}</span>
                          <span className="dim mono">{kindLabel(r).toLowerCase()}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="topo-domains" role="group" aria-label="Domains">
        {domains.map((d) => (
          <button
            key={d.id}
            className="chip"
            data-hue={d.hue}
            aria-pressed={selected === `d:${d.id}`}
            onClick={() => setSelected((s) => (s === `d:${d.id}` ? null : `d:${d.id}`))}
            onMouseEnter={() => setHovered(`d:${d.id}`)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(`d:${d.id}`)}
            onBlur={() => setHovered(null)}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
