import { memo, useMemo } from "react";
import type { WallpaperId } from "../settings";

/** Deterministic pseudo-random so the wallpaper is identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function Lattice() {
  const { pts, links } = useMemo(() => {
    const r = rng(7);
    const pts = Array.from({ length: 70 }, () => [r() * 1600, r() * 1000] as const);
    const links: [number, number][] = [];
    pts.forEach((p, i) => {
      pts.forEach((q, j) => {
        if (j <= i) return;
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (d < 190) links.push([i, j]);
      });
    });
    return { pts, links };
  }, []);
  return (
    <svg className="wp-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g stroke="var(--wp-line)" strokeWidth="1">
        {links.map(([a, b], i) => (
          <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
        ))}
      </g>
      <g fill="var(--wp-node)">
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i % 9 === 0 ? 2.6 : 1.4} />
        ))}
      </g>
    </svg>
  );
}

function Contour() {
  const paths = useMemo(() => {
    const out: string[] = [];
    for (let k = 0; k < 26; k++) {
      const base = 120 + k * 34;
      let d = `M-20 ${base}`;
      for (let x = 0; x <= 1640; x += 40) {
        const y = base + Math.sin(x / 210 + k * 0.45) * (26 + k * 1.6) + Math.cos(x / 97 + k) * 9;
        d += ` L${x} ${y.toFixed(1)}`;
      }
      out.push(d);
    }
    return out;
  }, []);
  return (
    <svg className="wp-svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="var(--wp-line)" strokeWidth="1.1">
        {paths.map((d, i) => (
          <path key={i} d={d} opacity={i % 5 === 0 ? 1 : 0.55} />
        ))}
      </g>
    </svg>
  );
}

export const Wallpaper = memo(function Wallpaper({ id }: { id: WallpaperId }) {
  return (
    <div className={`wp wp-${id}`} aria-hidden="true">
      <div className="wp-glow" />
      {id === "lattice" && <Lattice />}
      {id === "contour" && <Contour />}
      <div className="wp-vignette" />
    </div>
  );
});
