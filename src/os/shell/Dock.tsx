import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { APPS, DOCK_PINS } from "../apps";
import { getNode } from "../fs";
import { resolveTarget, useOS } from "../store";
import { useSettings } from "../settings";
import { AppIcon } from "../ui/AppIcon";
import type { AppId, IconSpec, Win } from "../types";

const BASE_SIZE = 48;

interface DockEntry {
  key: string;
  label: string;
  icon: IconSpec;
  /** Windows this entry represents. */
  wins: Win[];
  launch: () => void;
  pinned: boolean;
}

function matches(target: string, w: Win) {
  const r = resolveTarget(target);
  if (!r || r.app !== w.app) return false;
  if (r.app === "files" && target !== "app:files") return w.arg === r.arg;
  return true;
}

function DockItem({ entry, mouseX, magnify }: { entry: DockEntry; mouseX: MotionValue<number>; magnify: boolean }) {
  const os = useOS();
  const ref = useRef<HTMLButtonElement>(null);
  const dist = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? x - (r.left + r.width / 2) : Infinity;
  });
  const target = useTransform(dist, [-130, 0, 130], [BASE_SIZE, BASE_SIZE * 1.32, BASE_SIZE]);
  const size = useSpring(target, { mass: 0.1, stiffness: 180, damping: 14 });
  const scale = useTransform(size, (s) => s / BASE_SIZE);
  const running = entry.wins.length > 0;

  const onClick = () => {
    if (!running) return entry.launch();
    const top = [...entry.wins].sort((a, b) => b.z - a.z)[0];
    if (top.minimized) os.focus(top.id);
    else if (top.id === os.focusId) os.minimize(top.id);
    else os.focus(top.id);
  };

  const onContext = (e: React.MouseEvent) => {
    e.preventDefault();
    const r = ref.current!.getBoundingClientRect();
    os.openMenu(r.left, r.top - 8 - (entry.wins.length + 2) * 30, [
      ...entry.wins.map((w) => ({ label: w.title + (w.minimized ? " (minimized)" : ""), onSelect: () => os.focus(w.id) })),
      ...(entry.wins.length ? [{ separator: true } as const] : []),
      { label: running ? "New Window" : "Open", onSelect: entry.launch, disabled: running && entry.key.startsWith("app:") && !!APPS[entry.key.slice(4) as AppId]?.single },
      ...(running ? [{ label: entry.wins.length > 1 ? "Close All" : "Close", onSelect: () => entry.wins.forEach((w) => os.close(w.id)) }] : []),
    ]);
  };

  return (
    <li className="dock-li">
      <motion.button
        ref={ref}
        className={`dock-item${running ? " is-running" : ""}`}
        style={magnify ? { width: size, height: size } : { width: BASE_SIZE, height: BASE_SIZE }}
        onClick={onClick}
        onContextMenu={onContext}
        whileTap={{ scale: 0.92 }}
      >
        <motion.span className="dock-icon" style={magnify ? { scale } : undefined}>
          <AppIcon spec={entry.icon} size={BASE_SIZE} />
        </motion.span>
        <span className="dock-tip">{entry.label}</span>
        {running && <span className="sr-only">, running</span>}
      </motion.button>
      <span className={`dock-dot${running ? " on" : ""}${entry.wins.some((w) => w.minimized) && entry.wins.every((w) => w.minimized) ? " min" : ""}`} aria-hidden="true" />
    </li>
  );
}

export function Dock() {
  const os = useOS();
  const { reducedMotion } = useSettings();
  const mouseX = useMotionValue(Infinity);

  const pinned: DockEntry[] = DOCK_PINS.map((p) => {
    const node = getNode(p.target);
    return {
      key: p.target,
      label: p.label,
      icon: node?.icon ?? APPS.files.icon,
      wins: os.wins.filter((w) => matches(p.target, w)),
      launch: () => os.open(p.target, { source: "dock" }),
      pinned: true,
    };
  });

  // The Files pin owns every Files window except ones showing a folder that has its own pin.
  const pinnedFolderArgs = DOCK_PINS.map((p) => resolveTarget(p.target)).filter((r) => r?.app === "files" && r.arg).map((r) => r!.arg);
  pinned[0].wins = pinned[0].wins.filter((w) => !pinnedFolderArgs.includes(w.arg));

  const claimed = new Set(pinned.flatMap((e) => e.wins.map((w) => w.id)));
  const extraApps = [...new Set(os.wins.filter((w) => !claimed.has(w.id)).map((w) => w.app))];
  const extras: DockEntry[] = extraApps.map((app) => {
    const wins = os.wins.filter((w) => w.app === app && !claimed.has(w.id));
    const first = wins[0];
    const node = first.arg ? getNode(first.arg) : undefined;
    return {
      key: `run:${app}`,
      label: app === "reader" ? (wins.length > 1 ? `Documents (${wins.length})` : first.title) : APPS[app].title,
      icon: app === "reader" && node ? node.icon : APPS[app].icon,
      wins,
      launch: () => os.open(`app:${app}`),
      pinned: false,
    };
  });

  return (
    <nav className="dock-wrap" aria-label="Dock">
      <motion.ul
        className="dock surface-glass"
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {pinned.map((e) => (
          <DockItem key={e.key} entry={e} mouseX={mouseX} magnify={!reducedMotion} />
        ))}
        {extras.length > 0 && <li className="dock-sep" aria-hidden="true" />}
        {extras.map((e) => (
          <DockItem key={e.key} entry={e} mouseX={mouseX} magnify={!reducedMotion} />
        ))}
      </motion.ul>
    </nav>
  );
}
