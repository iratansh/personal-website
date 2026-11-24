import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, type LucideIcon } from "lucide-react";

export type MenuItem =
  | {
      separator?: false;
      label: string;
      onSelect?: () => void;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
      icon?: LucideIcon;
    }
  | { separator: true };

/** A keyboard-navigable menu list, shared by the menu bar, context menus, and the dock. */
export function MenuList({
  items,
  onClose,
  label,
  autoFocus = true,
}: {
  items: MenuItem[];
  onClose: () => void;
  label: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const enabled = () => [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];

  useEffect(() => {
    if (autoFocus) enabled()[0]?.focus();
  }, [autoFocus]);

  const onKey = (e: React.KeyboardEvent) => {
    const list = enabled();
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(i + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(i - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "Tab") {
      onClose();
    }
  };

  return (
    <ul className="menu" role="menu" aria-label={label} ref={ref} onKeyDown={onKey}>
      {items.map((it, i) =>
        it.separator ? (
          <li key={i} role="separator" className="menu-sep" />
        ) : (
          <li key={i} role="none">
            <button
              role={it.checked !== undefined ? "menuitemcheckbox" : "menuitem"}
              aria-checked={it.checked}
              className="menu-item"
              disabled={it.disabled}
              onClick={() => {
                onClose();
                it.onSelect?.();
              }}
            >
              <span className="menu-check">{it.checked ? <Check size={13} strokeWidth={2.4} /> : it.icon ? <it.icon size={14} /> : null}</span>
              <span className="menu-label">{it.label}</span>
              {it.shortcut && <kbd className="menu-kbd">{it.shortcut}</kbd>}
            </button>
          </li>
        ),
      )}
    </ul>
  );
}

/** A context menu positioned at the pointer and kept inside the viewport. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => {
      window.setTimeout(() => {
        const a = document.activeElement;
        if ((!a || a === document.body) && prev?.isConnected) prev.focus({ preventScroll: true });
      }, 60);
    };
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: Math.min(x, window.innerWidth - r.width - 6),
      y: Math.min(y, window.innerHeight - r.height - 6),
    });
  }, [x, y]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const blur = () => onClose();
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", blur);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", blur);
    };
  }, [onClose]);

  return (
    <div className="ctx surface-pop" ref={ref} style={{ left: pos.x, top: pos.y }} onContextMenu={(e) => e.preventDefault()}>
      <MenuList items={items} onClose={onClose} label="Context menu" />
    </div>
  );
}
