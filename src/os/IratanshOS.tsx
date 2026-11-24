import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { OSProvider, initialTarget, useOS } from "./store";
import { SettingsProvider, useSettings } from "./settings";
import { useIsMobile, isTypingTarget } from "./hooks";
import { Desktop } from "./shell/Desktop";
import { MenuBar } from "./shell/MenuBar";
import { Dock } from "./shell/Dock";
import { Launcher } from "./shell/Launcher";
import { Boot, NotificationCenter, Toasts } from "./shell/Overlays";
import { MobileShell } from "./shell/Mobile";
import { installLinkTracking, track } from "../analytics";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function useGlobalKeys() {
  const os = useOS();
  const { overdrive, setOverdrive } = useSettings();
  const seq = useRef<string[]>([]);
  const ref = useRef({ os, overdrive });
  ref.current = { os, overdrive };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { os } = ref.current;
      const mod = e.metaKey || e.ctrlKey;
      const focused = os.wins.find((w) => w.id === os.focusId);

      if (mod && (e.key.toLowerCase() === "k" || e.code === "Space")) {
        e.preventDefault();
        os.setLauncherOpen((v) => !v);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        os.open("app:settings");
        return;
      }

      seq.current = [...seq.current, e.key].slice(-KONAMI.length);
      if (seq.current.join() === KONAMI.join()) {
        seq.current = [];
        const on = !ref.current.overdrive;
        setOverdrive(on);
        track("easter_egg", { name: "konami" });
        os.toast(on ? "Overdrive engaged" : "Overdrive disengaged", on ? "Accent bus rerouted to violet." : "Back to emerald.");
        return;
      }

      // Window shortcuts use ⌥ because browsers reserve ⌘W / ⌘M / ⌘Tab.
      if (e.altKey && focused) {
        const k = e.code;
        if (k === "KeyW") return e.preventDefault(), os.close(focused.id);
        if (k === "KeyM") return e.preventDefault(), os.minimize(focused.id);
        if (k === "KeyF") return e.preventDefault(), os.toggleMax(focused.id);
        if (k === "ArrowLeft") return e.preventDefault(), os.tile(focused.id, "left");
        if (k === "ArrowRight") return e.preventDefault(), os.tile(focused.id, "right");
      }
      if (e.altKey && e.code === "Backquote") return e.preventDefault(), os.cycle();

      if (isTypingTarget(e.target) || mod || e.altKey) return;
      if (e.key === "`") {
        e.preventDefault();
        os.open("app:terminal", { source: "shortcut" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOverdrive]);
}

function Shell() {
  const os = useOS();
  const mobile = useIsMobile();
  const { reducedMotion } = useSettings();
  // The boot screen is pure motion, so reduced-motion users never see it.
  const [booting, setBooting] = useState(() => {
    if (reducedMotion) return false;
    try {
      return !sessionStorage.getItem("iratanshos.booted");
    } catch {
      return false;
    }
  });
  useGlobalKeys();

  const finishBoot = useCallback(() => {
    setBooting(false);
    try {
      sessionStorage.setItem("iratanshos.booted", "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Restart (from the brand menu) replays the boot screen and clears the desktop.
  useEffect(() => {
    const restart = () => {
      os.wins.forEach((w) => os.close(w.id));
      if (!reducedMotion) setBooting(true);
    };
    window.addEventListener("pos:restart", restart);
    return () => window.removeEventListener("pos:restart", restart);
  }, [os, reducedMotion]);

  // Deep links (/personal-website/projects/shrinkr) open their window once the desktop is up.
  // Read the deep link during the first render: effects (like the address-bar sync) can rewrite the URL before boot ends.
  const [deepLink] = useState(initialTarget);
  const opened = useRef(false);
  useEffect(() => {
    if (booting || opened.current) return;
    opened.current = true;
    const target = deepLink;
    if (target) os.open(target, { history: false, source: "link" });
  }, [booting, os, mobile, deepLink]);

  // Outbound link clicks are attributed to whichever app is focused.
  const focusedApp = useRef("desktop");
  focusedApp.current = os.wins.find((w) => w.id === os.focusId)?.app ?? "desktop";
  useEffect(() => installLinkTracking(() => focusedApp.current), []);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      {mobile ? (
        <MobileShell />
      ) : (
        <div className="os">
          <MenuBar />
          <Desktop />
          <Dock />
          <AnimatePresence>{os.centerOpen && <NotificationCenter />}</AnimatePresence>
          <Toasts />
        </div>
      )}
      <AnimatePresence>{os.launcherOpen && <Launcher />}</AnimatePresence>
      <AnimatePresence>{booting && <Boot onDone={finishBoot} />}</AnimatePresence>
    </MotionConfig>
  );
}

export default function IratanshOS() {
  return (
    <SettingsProvider>
      <OSProvider>
        <Shell />
      </OSProvider>
    </SettingsProvider>
  );
}
