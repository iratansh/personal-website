import { useId } from "react";
import { Lock } from "lucide-react";
import type { IconSpec, Tint } from "../types";

/** Light → dark stops for each tint. */
const TINTS: Record<Tint, [string, string]> = {
  emerald: ["#45e8ad", "#0c8a5f"],
  cyan: ["#6fdfff", "#13709f"],
  blue: ["#86a9ff", "#2a4cbf"],
  violet: ["#b8a3ff", "#5a3dc0"],
  amber: ["#ffd27c", "#c47e16"],
  rose: ["#ff93a3", "#bd3550"],
  slate: ["#a7b4b1", "#46524f"],
  ink: ["#333c40", "#0b0f11"],
};

/**
 * Every icon in iratanshOS comes from three hand-drawn shapes (folder, app tile, document),
 * tinted from one palette, so new items look native without new artwork.
 */
export function AppIcon({ spec, size = 48, locked }: { spec: IconSpec; size?: number; locked?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const badge = locked ? (
    <span className="ai-lock" aria-hidden="true">
      <Lock size={Math.max(9, size * 0.2)} strokeWidth={2.4} />
    </span>
  ) : null;

  if (spec.shape === "app") {
    const [a, b] = TINTS[spec.tint];
    const G = spec.glyph;
    return (
      <span className="ai" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
          <defs>
            <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
            <linearGradient id={`h${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#g${uid})`} />
          <rect x="4" y="4" width="56" height="56" rx="14" fill={`url(#h${uid})`} />
          <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" fill="none" stroke="#fff" strokeOpacity="0.18" />
        </svg>
        <G className="ai-glyph" size={size * 0.44} strokeWidth={1.75} color={spec.tint === "ink" ? "#45e8ad" : "#fff"} />
        {badge}
      </span>
    );
  }

  if (spec.shape === "folder") {
    const [a, b] = TINTS[spec.tint];
    const G = spec.glyph;
    return (
      <span className="ai" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
          <defs>
            <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          </defs>
          <path d="M6 16a4 4 0 014-4h14l5 5h25a4 4 0 014 4v4H6z" fill={b} opacity="0.85" />
          <rect x="6" y="20" width="52" height="34" rx="5" fill={`url(#f${uid})`} />
          <path d="M11 21h42" stroke="#fff" strokeOpacity="0.35" strokeLinecap="round" />
        </svg>
        {G && <G className="ai-glyph ai-glyph-folder" size={size * 0.3} strokeWidth={2} color="#fff" />}
        {badge}
      </span>
    );
  }

  const tint = spec.tint ? TINTS[spec.tint][1] : "#5d6a67";
  const G = spec.glyph;
  return (
    <span className="ai" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <path d="M14 5h26l12 12v40a3 3 0 01-3 3H14a3 3 0 01-3-3V8a3 3 0 013-3z" fill="var(--doc-paper)" />
        <path d="M40 5v9a3 3 0 003 3h9" fill="var(--doc-fold)" />
        <path d="M14 5.5h25.6L51.5 17.4V57a2.5 2.5 0 01-2.5 2.5H14A2.5 2.5 0 0111.5 57V8A2.5 2.5 0 0114 5.5z" fill="none" stroke="#000" strokeOpacity="0.12" />
        {!G && (
          <g stroke={tint} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round">
            <path d="M18 25h20M18 31h26M18 37h22" />
          </g>
        )}
        <rect x="16" y="44" width={spec.ext.length * 6 + 8} height="10" rx="2.5" fill={tint} />
        <text x="20" y="51.6" className="ai-ext">
          {spec.ext.toUpperCase()}
        </text>
      </svg>
      {G && <G className="ai-glyph ai-glyph-doc" size={size * 0.3} strokeWidth={2} color={tint} />}
      {badge}
    </span>
  );
}
