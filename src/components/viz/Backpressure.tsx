import { useEffect, useRef, useState } from "react";
import { useNexus } from "../../lib/nexus";
import { useActive, useSize } from "../../lib/hooks";
import { Icon } from "../ui/Icon";
import { toHref } from "../../lib/routes";
import { track } from "../../analytics";

type Policy = "reject" | "buffer";

interface Item {
  id: number;
  born: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  state: "inflight" | "queued" | "working" | "done" | "rejected";
  worker?: number;
  alpha: number;
}

interface Worker {
  item: Item | null;
  remaining: number;
  total: number;
}

const SERVICE_RATE = 3; // items per worker per second (mean)
/** Until someone touches a control, the sim demonstrates itself: a burst every DEMO_EVERY seconds. */
const DEMO_FIRST = 2.5;
const DEMO_EVERY = 9;
const DEMO_BURST = 40;

function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

export default function Backpressure({ compact = false }: { compact?: boolean }) {
  const { reducedMotion } = useNexus();
  const [rate, setRate] = useState(7);
  const [workers, setWorkers] = useState(3);
  const [capacity, setCapacity] = useState(12);
  const [policy, setPolicy] = useState<Policy>("reject");
  const [running, setRunning] = useState(true);
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const active = useActive(wrapRef);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0, done: 0, depth: 0, p50: 0, p99: 0, thru: 0 });

  const demo = useRef({ on: !compact, next: DEMO_FIRST }); // hero (compact) stays calm until clicked
  const touch = () => {
    demo.current.on = false;
  };

  const cfg = useRef({ rate, workers, capacity, policy, running, reducedMotion });
  cfg.current = { rate, workers, capacity, policy, running, reducedMotion };

  const sim = useRef({
    t: 0,
    nextArrival: 0,
    nextId: 1,
    items: [] as Item[],
    queue: [] as Item[],
    pool: [] as Worker[],
    latencies: [] as number[],
    completions: [] as number[],
    history: [] as number[],
    accepted: 0,
    rejected: 0,
    done: 0,
    burst: 0,
  });

  const reset = () => {
    const s = sim.current;
    Object.assign(s, {
      t: 0,
      nextArrival: 0,
      items: [],
      queue: [],
      pool: [],
      latencies: [],
      completions: [],
      history: [],
      accepted: 0,
      rejected: 0,
      done: 0,
      burst: 0,
    });
    demo.current.next = DEMO_FIRST;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.width || !active) return;
    const w = size.width;
    const h = size.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();
    let statTimer = 0;
    let histTimer = 0;

    const prodX = 46;
    const qx0 = w * 0.22;
    const qx1 = w * 0.56;
    const wx = w * 0.66;
    const ww = w * 0.2;
    const sinkX = w - 40;
    const midY = (36 + h - 96) / 2;
    const laneTop = 36;
    const laneBottom = h - 96;

    const slotPos = (i: number, cap: number) => {
      const perRow = Math.min(cap, 16);
      const rowsN = Math.ceil(Math.min(cap, 48) / perRow);
      const sw = (qx1 - qx0) / perRow;
      const r = Math.floor(i / perRow);
      const c = i % perRow;
      const rowH = 16;
      const y0 = midY - ((rowsN - 1) * rowH) / 2;
      return [qx1 - sw * (c + 0.5), y0 + r * rowH] as const;
    };
    const workerPos = (k: number, n: number) => {
      const span = laneBottom - laneTop;
      const lh = span / n;
      return [wx, laneTop + lh * (k + 0.5), lh] as const;
    };

    const step = (dt: number) => {
      const s = sim.current;
      const c = cfg.current;
      s.t += dt;

      // Resize worker pool
      while (s.pool.length < c.workers) s.pool.push({ item: null, remaining: 0, total: 1 });
      if (s.pool.length > c.workers) {
        for (const wk of s.pool.slice(c.workers)) if (wk.item) s.queue.unshift(wk.item);
        s.pool.length = c.workers;
      }

      // Arrivals (Poisson) + bursts
      const admit = () => {
        const it: Item = {
          id: s.nextId++,
          born: s.t,
          x: prodX,
          y: midY,
          tx: qx0,
          ty: midY,
          state: "inflight",
          alpha: 1,
        };
        if (c.policy === "reject" && s.queue.length >= c.capacity) {
          it.state = "rejected";
          it.tx = qx0 - 10;
          it.ty = midY + 70 + Math.random() * 30;
          s.rejected++;
        } else {
          it.state = "queued";
          s.queue.push(it);
          s.accepted++;
        }
        s.items.push(it);
      };
      while (s.nextArrival <= s.t) {
        admit();
        s.nextArrival += -Math.log(1 - Math.random()) / c.rate;
      }
      if (demo.current.on && s.t >= demo.current.next) {
        s.burst += DEMO_BURST;
        demo.current.next = s.t + DEMO_EVERY;
      }
      if (s.burst > 0) {
        const n = Math.min(s.burst, 6);
        for (let i = 0; i < n; i++) admit();
        s.burst -= n;
      }

      // Workers
      s.pool.forEach((wk, k) => {
        if (wk.item) {
          wk.remaining -= dt;
          if (wk.remaining <= 0) {
            const it = wk.item;
            it.state = "done";
            it.tx = sinkX;
            it.ty = workerPos(k, s.pool.length)[1];
            s.latencies.push(s.t - it.born);
            if (s.latencies.length > 300) s.latencies.shift();
            s.completions.push(s.t);
            s.done++;
            wk.item = null;
          }
        }
        if (!wk.item && s.queue.length) {
          const it = s.queue.shift()!;
          it.state = "working";
          it.worker = k;
          const svc = (-Math.log(1 - Math.random()) / SERVICE_RATE) * 0.6 + 0.4 / SERVICE_RATE;
          wk.item = it;
          wk.remaining = svc;
          wk.total = svc;
        }
      });

      // Targets for queued items
      const visibleCap = c.policy === "reject" ? c.capacity : 48;
      s.queue.forEach((it, i) => {
        if (i < visibleCap) {
          const [x, y] = slotPos(i, visibleCap);
          it.tx = x;
          it.ty = y;
        } else {
          it.tx = qx0 + 4;
          it.ty = midY;
        }
      });
      s.pool.forEach((wk, k) => {
        if (wk.item) {
          const [x, y] = workerPos(k, s.pool.length);
          wk.item.tx = x + 14;
          wk.item.ty = y;
        }
      });

      // Motion
      const lerp = c.reducedMotion ? 1 : 1 - Math.pow(0.0005, dt);
      s.items.forEach((it) => {
        it.x += (it.tx - it.x) * lerp;
        it.y += (it.ty - it.y) * lerp;
        if (it.state === "rejected" || (it.state === "done" && Math.abs(it.x - it.tx) < 6)) it.alpha -= dt * 2.2;
      });
      s.items = s.items.filter((it) => it.alpha > 0);
      while (s.completions.length && s.completions[0] < s.t - 3) s.completions.shift();
    };

    const draw = () => {
      const s = sim.current;
      const c = cfg.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const MONO = '"Geist Mono", monospace';
      ctx.font = `10px ${MONO}`;
      ctx.textBaseline = "middle";

      // Producer
      ctx.strokeStyle = "#5ad8ff";
      ctx.fillStyle = "#080b0d";
      ctx.beginPath();
      ctx.arc(prodX, midY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5ad8ff";
      ctx.beginPath();
      ctx.arc(prodX, midY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6d7b77";
      ctx.textAlign = "center";
      ctx.fillText("PRODUCERS", prodX, midY + 30);
      ctx.fillText(`${c.rate}/s`, prodX, midY + 44);

      // Lane
      ctx.strokeStyle = "rgba(150,220,200,0.12)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(prodX + 16, midY);
      ctx.lineTo(qx0 - 6, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Queue region
      const depth = s.queue.length;
      const fill = c.policy === "reject" ? depth / c.capacity : Math.min(1, depth / 120);
      const qColor = fill > 0.85 ? "#ff6274" : fill > 0.55 ? "#ffbf5e" : "#34e0a1";
      const visibleCapBox = c.policy === "reject" ? c.capacity : 48;
      const rowsN = Math.ceil(Math.min(visibleCapBox, 48) / Math.min(visibleCapBox, 16));
      const boxH = rowsN * 16 + 30;
      const boxY = midY - boxH / 2;
      ctx.strokeStyle = "rgba(150,220,200,0.18)";
      ctx.strokeRect(qx0 - 6, boxY, qx1 - qx0 + 12, boxH);
      ctx.fillStyle = qColor;
      ctx.globalAlpha = 0.05 + fill * 0.1;
      ctx.fillRect(qx0 - 6, boxY, qx1 - qx0 + 12, boxH);
      ctx.globalAlpha = 1;
      // fill meter along the bottom edge of the queue
      ctx.fillStyle = qColor;
      ctx.fillRect(qx0 - 6, boxY + boxH - 2, (qx1 - qx0 + 12) * Math.min(1, fill), 2);
      // gate
      ctx.strokeStyle = c.policy === "reject" && depth >= c.capacity ? "#ff6274" : "rgba(150,220,200,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(qx0 - 6, midY - 18);
      ctx.lineTo(qx0 - 6, midY + 18);
      ctx.stroke();
      ctx.lineWidth = 1;
      const visibleCap = c.policy === "reject" ? c.capacity : 48;
      for (let i = 0; i < visibleCap; i++) {
        const [x, y] = slotPos(i, visibleCap);
        ctx.strokeStyle = "rgba(150,220,200,0.12)";
        ctx.strokeRect(x - 5, y - 5, 10, 10);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#6d7b77";
      ctx.fillText(
        c.policy === "reject" ? `BOUNDED QUEUE  ${depth}/${c.capacity}` : `UNBOUNDED BUFFER  ${depth}`,
        qx0 - 6,
        boxY + boxH + 16,
      );
      if (c.policy === "buffer" && depth > 48) {
        ctx.fillStyle = qColor;
        ctx.fillText(`+${depth - 48} off-screen`, qx0 - 6, boxY + boxH + 30);
      }

      // Workers
      s.pool.forEach((wk, k) => {
        const [x, y, lh] = workerPos(k, s.pool.length);
        const bh = Math.min(22, lh - 6);
        ctx.strokeStyle = wk.item ? "rgba(52,224,161,0.5)" : "rgba(150,220,200,0.16)";
        ctx.strokeRect(x, y - bh / 2, ww, bh);
        if (wk.item) {
          const p = 1 - Math.max(0, wk.remaining) / wk.total;
          ctx.fillStyle = "rgba(52,224,161,0.14)";
          ctx.fillRect(x, y - bh / 2, ww * p, bh);
        }
        ctx.fillStyle = "#46524f";
        ctx.textAlign = "right";
        ctx.fillText(`w${k}`, x + ww - 6, y);
      });
      ctx.textAlign = "left";
      ctx.fillStyle = "#6d7b77";
      ctx.fillText(`WORKERS ×${s.pool.length}  ~${(s.pool.length * SERVICE_RATE).toFixed(0)}/s`, wx, laneBottom + 18);

      // Sink
      ctx.strokeStyle = "rgba(150,220,200,0.35)";
      ctx.beginPath();
      ctx.moveTo(sinkX, laneTop);
      ctx.lineTo(sinkX, laneBottom);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = "#6d7b77";
      ctx.fillText("SINK", sinkX, laneBottom + 18);

      // Items
      s.items.forEach((it) => {
        ctx.globalAlpha = Math.max(0, it.alpha);
        ctx.fillStyle =
          it.state === "rejected" ? "#ff6274" : it.state === "done" ? "#5ad8ff" : it.state === "working" ? "#34e0a1" : "#e9f0ee";
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.state === "queued" ? 3 : 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Depth history sparkline
      const hx0 = 16;
      const hx1 = w - 16;
      const hy1 = h - 14;
      const hy0 = h - 44;
      const maxD = Math.max(c.policy === "reject" ? c.capacity : 10, ...s.history);
      ctx.strokeStyle = "rgba(150,220,200,0.08)";
      ctx.beginPath();
      ctx.moveTo(hx0, hy1);
      ctx.lineTo(hx1, hy1);
      ctx.stroke();
      if (s.history.length > 1) {
        ctx.beginPath();
        s.history.forEach((d, i) => {
          const x = hx0 + ((hx1 - hx0) * i) / 119;
          const y = hy1 - ((hy1 - hy0) * d) / maxD;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = qColor;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#46524f";
      ctx.fillText("QUEUE DEPTH · LAST 30 S", hx0, hy0 - 8);
      ctx.strokeStyle = "rgba(150,220,200,0.06)";
      ctx.beginPath();
      ctx.moveTo(0, hy0 - 22);
      ctx.lineTo(w, hy0 - 22);
      ctx.stroke();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (cfg.current.running) {
        step(dt);
        histTimer += dt;
        if (histTimer > 0.25) {
          histTimer = 0;
          sim.current.history.push(sim.current.queue.length);
          if (sim.current.history.length > 120) sim.current.history.shift();
        }
      }
      draw();
      statTimer += dt;
      if (statTimer > 0.2) {
        statTimer = 0;
        const s = sim.current;
        setStats({
          accepted: s.accepted,
          rejected: s.rejected,
          done: s.done,
          depth: s.queue.length,
          p50: percentile(s.latencies, 50),
          p99: percentile(s.latencies, 99),
          thru: s.completions.length / 3,
        });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size.width, size.height, active]);

  const capacityPerSec = workers * SERVICE_RATE;
  const load = rate / capacityPerSec;

  if (compact) {
    return (
      <div className="bp bp-compact">
        <div className="bp-stage frame" ref={wrapRef}>
          <canvas ref={canvasRef} className="bp-canvas" aria-label="Animated queue simulation" role="img" />
          <span className="bp-badge label">Live · admission control</span>
        </div>
        <div className="bp-strip">
          <dl className="bp-mini">
            <div>
              <dt className="label">Queue</dt>
              <dd>
                {stats.depth}
                <span className="dim">/{capacity}</span>
              </dd>
            </div>
            <div>
              <dt className="label">p99</dt>
              <dd>{stats.p99.toFixed(2)}s</dd>
            </div>
            <div>
              <dt className="label">Rejected</dt>
              <dd className={stats.rejected ? "bad" : ""}>{stats.rejected}</dd>
            </div>
          </dl>
          <button
            className="btn"
            onClick={() => {
              touch();
              sim.current.burst += 60;
              track("lab_interaction", { action: "burst-hero" });
            }}
          >
            <Icon name="zap" /> Burst ×60
          </button>
          <a className="link-arrow" href={toHref({ module: "lab" })}>
            Tune it <Icon name="arrowRight" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bp">
      <div className="bp-stage frame" ref={wrapRef}>
        <canvas ref={canvasRef} className="bp-canvas" aria-label="Animated queue simulation" role="img" />
        <span className="bp-badge label">Simulation · runs in your browser</span>
      </div>

      <div className="bp-console">
        <div className="bp-controls">
          <label className="bp-slider">
            <span className="label">Offered load</span>
            <input type="range" min={1} max={40} value={rate} onChange={(e) => (touch(), setRate(+e.target.value))} />
            <span className="mono">{rate}/s</span>
          </label>
          <label className="bp-slider">
            <span className="label">Workers</span>
            <input type="range" min={1} max={8} value={workers} onChange={(e) => (touch(), setWorkers(+e.target.value))} />
            <span className="mono">{workers}</span>
          </label>
          <label className="bp-slider">
            <span className="label">Queue capacity</span>
            <input
              type="range"
              min={4}
              max={48}
              value={capacity}
              onChange={(e) => (touch(), setCapacity(+e.target.value))}
              disabled={policy === "buffer"}
            />
            <span className="mono">{policy === "buffer" ? "∞" : capacity}</span>
          </label>

          <div className="bp-policy" role="radiogroup" aria-label="Overload policy">
            {(
              [
                ["reject", "Reject when full"],
                ["buffer", "Buffer everything"],
              ] as const
            ).map(([p, l]) => (
              <button key={p} role="radio" aria-checked={policy === p} onClick={() => {
                  touch();
                  setPolicy(p);
                  track("lab_interaction", { action: `policy-${p}` });
                }} className="chip">
                {l}
              </button>
            ))}
          </div>

          <div className="bp-actions">
            <button className="btn" onClick={() => {
                touch();
                sim.current.burst += 60;
                track("lab_interaction", { action: "burst" });
              }}>
              <Icon name="zap" /> Burst ×60
            </button>
            <button className="btn btn-ghost" onClick={() => (touch(), setRunning((r) => !r))} aria-pressed={!running}>
              <Icon name={running ? "pause" : "play"} /> {running ? "Pause" : "Resume"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                reset();
                track("lab_interaction", { action: "reset" });
              }}
            >
              <Icon name="reset" /> Reset
            </button>
          </div>
        </div>

        <dl className="bp-stats">
          <div>
            <dt className="label">Utilisation</dt>
            <dd className={load > 1 ? "warn" : ""}>{Math.round(load * 100)}%</dd>
          </div>
          <div>
            <dt className="label">Queue depth</dt>
            <dd>{stats.depth}</dd>
          </div>
          <div>
            <dt className="label">Throughput</dt>
            <dd>{stats.thru.toFixed(1)}/s</dd>
          </div>
          <div>
            <dt className="label">Latency p50</dt>
            <dd>{stats.p50.toFixed(2)}s</dd>
          </div>
          <div>
            <dt className="label">Latency p99</dt>
            <dd className={stats.p99 > 3 ? "warn" : ""}>{stats.p99.toFixed(2)}s</dd>
          </div>
          <div>
            <dt className="label">Rejected</dt>
            <dd className={stats.rejected ? "bad" : ""}>
              {stats.rejected}
              <span className="dim"> / {stats.accepted + stats.rejected}</span>
            </dd>
          </div>
        </dl>
        <p className="bp-explain">
          {policy === "reject"
            ? load > 1
              ? "Offered load exceeds capacity. The queue fills, the gate closes, and senders get an explicit rejection, so latency stays bounded."
              : "Capacity covers the load. Queue depth stays near zero; latency is roughly service time."
            : load > 1
              ? "Nothing is refused, so the backlog grows without bound. Every new item waits behind it. Watch p99 climb."
              : "Buffering looks harmless while capacity covers the load. Push the offered load past capacity, or hit Burst."}
        </p>
      </div>
    </div>
  );
}
