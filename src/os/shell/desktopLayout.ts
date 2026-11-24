import { useCallback, useMemo, useState } from "react";
import { DESKTOP_ITEMS, NODE_PATHS, getNode } from "../fs";
import { BASE, MENU_H, useOS } from "../store";
import { useViewport } from "../hooks";
import type { MenuItem } from "../ui/Menu";

export const CELL_W = 96;
export const CELL_H = 104;
export const LEFT = 18;
export const TOP = MENU_H + 16;
const POS_KEY = "iratanshos.icons";

export type Cell = { c: number; r: number };

function loadPositions(): Record<string, Cell> {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) ?? "{}") as Record<string, Cell>;
  } catch {
    return {};
  }
}

/** Default layout: a single column down the left edge, wrapping when the screen is short. */
function defaultCells(rows: number): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  DESKTOP_ITEMS.forEach((id, i) => (out[id] = { c: Math.floor(i / rows), r: i % rows }));
  return out;
}

export function useDesktopLayout() {
  const vp = useViewport();
  const rows = Math.max(3, Math.floor((vp.h - TOP - 110) / CELL_H));
  const [custom, setCustom] = useState(loadPositions);
  const cells = useMemo(() => {
    const base = defaultCells(rows);
    const out: Record<string, Cell> = {};
    const taken = new Set<string>();
    for (const id of DESKTOP_ITEMS) {
      const want = custom[id];
      if (want && want.r < rows) {
        out[id] = want;
        taken.add(`${want.c}:${want.r}`);
      }
    }
    for (const id of DESKTOP_ITEMS) {
      if (out[id]) continue;
      let cell = base[id];
      let n = 0;
      while (taken.has(`${cell.c}:${cell.r}`) && n < 200) {
        n++;
        cell = { c: Math.floor(n / rows), r: n % rows };
      }
      out[id] = cell;
      taken.add(`${cell.c}:${cell.r}`);
    }
    return out;
  }, [custom, rows]);

  const place = useCallback((id: string, cell: Cell) => {
    setCustom((cur) => {
      const next = { ...cur, [id]: cell };
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);
  const reset = useCallback(() => {
    setCustom({});
    try {
      localStorage.removeItem(POS_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);
  return { cells, rows, place, reset, vp };
}

/** Context-menu entries for any filesystem item. */
export function itemMenu(os: ReturnType<typeof useOS>, id: string): MenuItem[] {
  const node = getNode(id);
  if (!node) return [];
  const items: MenuItem[] = [{ label: node.kind === "folder" ? "Open" : `Open ${node.name}`, onSelect: () => os.open(id, { source: "context" }) }];
  if (node.parent && node.parent !== "desktop") items.push({ label: "Show in Files", onSelect: () => os.open(node.parent!) });
  items.push({
    label: "Copy Link",
    onSelect: () => {
      const p = NODE_PATHS[id] ?? "";
      void navigator.clipboard?.writeText(`${window.location.origin}${BASE}${p}`).then(
        () => os.toast("Link copied", node.name),
        () => os.toast("Couldn't copy the link"),
      );
    },
  });
  return items;
}

