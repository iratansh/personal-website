import { useEffect, useRef, useState } from "react";
import { Battery, BatteryCharging, Bell, Search, Wifi, WifiOff } from "lucide-react";
import { useOS } from "../store";
import { useSettings } from "../settings";
import { APPS } from "../apps";
import { MOD } from "../hooks";
import { MenuList, type MenuItem } from "../ui/Menu";
import { profile } from "../../data/profile";

/**
 * The iratanshOS mark: a lowercase "i" followed by a terminal cursor, so it reads "i_", a prompt
 * waiting for input. The dot is a cyan node (the network motif); the cursor blinks while booting.
 */
export function Mark({ size = 16, blink = false }: { size?: number; blink?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={`mark${blink ? " mark-blink" : ""}`}>
      <circle cx="7.6" cy="4.9" r="2.35" fill="var(--accent-2)" />
      <rect x="5.7" y="9" width="3.8" height="11.2" rx="1.9" fill="currentColor" />
      <rect className="mark-cursor" x="12" y="16.4" width="8.6" height="3.8" rx="1.9" fill="currentColor" />
    </svg>
  );
}

/** The mark on a dark tile, for app icons and the About window. */
export function MarkTile({ size = 64 }: { size?: number }) {
  return (
    <span className="mark-tile force-dark" style={{ width: size, height: size, borderRadius: size * 0.26 }}>
      <Mark size={size * 0.58} />
    </span>
  );
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return on;
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

/** Real battery level where the browser exposes it (Chromium); hidden everywhere else. */
function useBattery() {
  const [b, setB] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (!nav.getBattery) return;
    let mgr: BatteryManager | null = null;
    const read = () => mgr && setB({ level: mgr.level, charging: mgr.charging });
    nav.getBattery().then((m) => {
      mgr = m;
      read();
      m.addEventListener("levelchange", read);
      m.addEventListener("chargingchange", read);
    }, () => undefined);
    return () => {
      mgr?.removeEventListener("levelchange", read);
      mgr?.removeEventListener("chargingchange", read);
    };
  }, []);
  return b;
}

export function MenuBar() {
  const os = useOS();
  const { settings, set } = useSettings();
  const [openId, setOpenId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const now = useClock();
  const online = useOnline();
  const battery = useBattery();
  const focused = os.wins.find((w) => w.id === os.focusId);
  const appName = focused ? APPS[focused.app].title : "Desktop";
  const isFiles = focused?.app === "files";

  useEffect(() => {
    if (!openId) return;
    const down = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, [openId]);

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(
      () => os.toast("Link copied", "Paste it anywhere to reopen this window."),
      () => os.toast("Couldn't copy the link"),
    );
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => os.toast("Full screen isn't available here"));
  };

  const menus: { id: string; label: string; items: MenuItem[]; brand?: boolean }[] = [
    {
      id: "brand",
      label: "iratanshOS",
      brand: true,
      items: [
        { label: "About iratanshOS", onSelect: () => os.open("app:about") },
        { separator: true },
        { label: "Settings…", shortcut: `${MOD},`, onSelect: () => os.open("app:settings") },
        { label: "Keyboard Shortcuts", onSelect: () => os.open("help") },
        { separator: true },
        { label: "Restart…", onSelect: () => window.dispatchEvent(new Event("pos:restart")) },
      ],
    },
    {
      id: "file",
      label: "File",
      items: [
        { label: "New Files Window", onSelect: () => os.open("desktop") },
        { label: "Open…", shortcut: `${MOD}K`, onSelect: () => os.setLauncherOpen(true) },
        { label: "Open Résumé", onSelect: () => os.open("resume", { source: "menu" }) },
        { label: "Open Projects", onSelect: () => os.open("projects") },
        { separator: true },
        { label: "Close Window", shortcut: "⌥W", disabled: !focused, onSelect: () => focused && os.close(focused.id) },
      ],
    },
    {
      id: "edit",
      label: "Edit",
      items: [
        { label: "Copy Link to Window", disabled: !focused, onSelect: copyLink },
        { label: "Select All Desktop Icons", onSelect: () => window.dispatchEvent(new Event("pos:select-all")) },
        { separator: true },
        { label: "Find…", shortcut: `${MOD}K`, onSelect: () => os.setLauncherOpen(true) },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        { label: "Show Desktop", onSelect: os.minimizeAll, disabled: !os.wins.length },
        { separator: true },
        {
          label: "as Icons",
          disabled: !isFiles,
          checked: isFiles ? (os.filesView[focused!.id] ?? "grid") === "grid" : undefined,
          onSelect: () => focused && os.setFilesView(focused.id, "grid"),
        },
        {
          label: "as List",
          disabled: !isFiles,
          checked: isFiles ? os.filesView[focused!.id] === "list" : undefined,
          onSelect: () => focused && os.setFilesView(focused.id, "list"),
        },
        { separator: true },
        { label: "Desktop Icons", checked: settings.showIcons, onSelect: () => set("showIcons", !settings.showIcons) },
        { label: "Clean Up Desktop", onSelect: () => window.dispatchEvent(new Event("pos:reset-icons")) },
        { label: document.fullscreenElement ? "Exit Full Screen" : "Enter Full Screen", onSelect: fullscreen },
      ],
    },
    {
      id: "window",
      label: "Window",
      items: [
        { label: "Minimize", shortcut: "⌥M", disabled: !focused, onSelect: () => focused && os.minimize(focused.id) },
        {
          label: focused?.mode === "max" ? "Restore" : "Maximize",
          shortcut: "⌥F",
          disabled: !focused,
          onSelect: () => focused && os.toggleMax(focused.id),
        },
        { label: "Tile Left", shortcut: "⌥←", disabled: !focused, onSelect: () => focused && os.tile(focused.id, "left") },
        { label: "Tile Right", shortcut: "⌥→", disabled: !focused, onSelect: () => focused && os.tile(focused.id, "right") },
        { separator: true },
        { label: "Cycle Windows", shortcut: "⌥`", disabled: os.wins.length < 2, onSelect: os.cycle },
        { label: "Bring All to Front", disabled: !os.wins.length, onSelect: os.bringAllToFront },
        ...(os.wins.length ? [{ separator: true } as MenuItem] : []),
        ...[...os.wins]
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
          .map<MenuItem>((w) => ({ label: w.title, checked: w.id === os.focusId, onSelect: () => os.focus(w.id) })),
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        { label: "Search iratanshOS…", shortcut: `${MOD}K`, onSelect: () => os.setLauncherOpen(true) },
        { label: "Keyboard Shortcuts", onSelect: () => os.open("help") },
        { label: "About iratanshOS", onSelect: () => os.open("app:about") },
        { label: "Privacy", onSelect: () => os.open("privacy") },
        { separator: true },
        { label: "View Source on GitHub", onSelect: () => window.open(profile.siteRepo, "_blank", "noopener") },
      ],
    },
  ];

  /** Left/Right walk between menus; if one is open, the neighbour opens instead. */
  const onBarKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const ids = menus.map((m) => m.id);
    const active = document.activeElement;
    const cur = ids.findIndex((id) => triggers.current[id] === active || triggers.current[id]?.parentElement?.contains(active));
    if (cur < 0) return;
    e.preventDefault();
    const next = ids[(cur + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
    if (openId) setOpenId(next);
    else triggers.current[next]?.focus();
  };

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="menubar" ref={barRef}>
      <a className="skip-link" href="#" onClick={(e) => (e.preventDefault(), os.setLauncherOpen(true))}>
        Search iratanshOS
      </a>
      <nav className="mb-left" aria-label="Menus" onKeyDown={onBarKey}>
        {menus.map((m) => (
          <div key={m.id} className="mb-menu">
            <button
              ref={(el) => (triggers.current[m.id] = el)}
              className={`mb-btn${m.brand ? " mb-brand" : ""}${openId === m.id ? " is-open" : ""}`}
              aria-haspopup="menu"
              aria-expanded={openId === m.id}
              aria-label={m.brand ? "iratanshOS menu" : undefined}
              onClick={() => setOpenId((o) => (o === m.id ? null : m.id))}
              onPointerEnter={() => openId && openId !== m.id && setOpenId(m.id)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpenId(m.id);
                }
              }}
            >
              {m.brand ? (
                <>
                  <Mark size={18} /> <span>iratanshOS</span>
                </>
              ) : (
                m.label
              )}
            </button>
            {openId === m.id && (
              <div className="mb-drop surface-pop">
                <MenuList
                  items={m.items}
                  onClose={() => {
                    setOpenId(null);
                    triggers.current[m.id]?.focus();
                  }}
                  label={m.label}
                />
              </div>
            )}
            {m.brand && <span className="mb-app">{appName}</span>}
          </div>
        ))}
      </nav>
      <div className="mb-right">
        <button className="mb-icon" onClick={() => os.setLauncherOpen(true)} aria-label="Search" title={`Search (${MOD}K)`}>
          <Search size={14} />
        </button>
        {battery && (
          <span className="mb-status" title={`Battery ${Math.round(battery.level * 100)}%${battery.charging ? ", charging" : ""}`}>
            {battery.charging ? <BatteryCharging size={16} /> : <Battery size={16} />}
            <span className="mb-pct">{Math.round(battery.level * 100)}%</span>
          </span>
        )}
        <span className="mb-status" role="img" title={online ? "Online" : "Offline: content already loaded still works"} aria-label={online ? "Online" : "Offline"}>
          {online ? <Wifi size={15} /> : <WifiOff size={15} />}
        </span>
        <button
          className={`mb-clock${os.centerOpen ? " is-open" : ""}`}
          onClick={() => os.setCenterOpen((v) => !v)}
          aria-expanded={os.centerOpen}
          aria-describedby="mb-clock-hint"
          title="Notifications"
        >
          <span id="mb-clock-hint" className="sr-only">
            Opens notifications
          </span>
          <Bell size={13} className="mb-bell" />
          <span>{date}</span>
          <span>{time}</span>
        </button>
      </div>
    </header>
  );
}
