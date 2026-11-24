import { useEffect, useState } from "react";
import { Accessibility, Image, Info, LayoutGrid, Palette, Shield, Volume2 } from "lucide-react";
import { useSettings, WALLPAPERS, playCue, type MotionPref } from "../settings";
import { useOS } from "../store";
import { Wallpaper } from "../shell/Wallpaper";
import { ConsentControls } from "./reader/PrivacyDoc";
import type { AppProps } from "../types";

const SECTIONS = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "wallpaper", label: "Wallpaper", icon: Image },
  { id: "desktop", label: "Desktop", icon: LayoutGrid },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "about", label: "About", icon: Info },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={`toggle${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div>
        <strong>{title}</strong>
        {desc && <p>{desc}</p>}
      </div>
      <div className="set-ctl">{children}</div>
    </div>
  );
}

export default function Settings({ arg }: AppProps) {
  const { settings, set, reducedMotion } = useSettings();
  const os = useOS();
  const valid = (a?: string): Section => (SECTIONS.some((s) => s.id === a) ? (a as Section) : "appearance");
  const [sec, setSec] = useState<Section>(() => valid(arg));
  useEffect(() => setSec(valid(arg)), [arg]);

  return (
    <div className="settings">
      <nav className="set-side" aria-label="Settings sections">
        {SECTIONS.map((s) => (
          <button key={s.id} aria-current={sec === s.id ? "page" : undefined} onClick={() => setSec(s.id)}>
            <s.icon size={15} /> {s.label}
          </button>
        ))}
      </nav>
      <div className="set-body">
        {sec === "appearance" && (
          <>
            <h2>Appearance</h2>
            <div className="theme-pick" role="radiogroup" aria-label="Appearance">
              {(["dark", "light"] as const).map((t) => (
                <button key={t} role="radio" aria-checked={settings.theme === t} className={`theme-card theme-${t}`} onClick={() => set("theme", t)}>
                  <span className="theme-swatch">
                    <i />
                    <i />
                  </span>
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </>
        )}
        {sec === "wallpaper" && (
          <>
            <h2>Wallpaper</h2>
            <div className="wp-pick" role="radiogroup" aria-label="Wallpaper">
              {WALLPAPERS.map((w) => (
                <button key={w.id} role="radio" aria-checked={settings.wallpaper === w.id} className="wp-card" onClick={() => set("wallpaper", w.id)}>
                  <span className="wp-thumb">
                    <Wallpaper id={w.id} />
                  </span>
                  <strong>{w.name}</strong>
                  <span>{w.description}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {sec === "desktop" && (
          <>
            <h2>Desktop</h2>
            <Row title="Show desktop icons" desc="Also shows the welcome card.">
              <Toggle on={settings.showIcons} onChange={(v) => set("showIcons", v)} label="Show desktop icons" />
            </Row>
            <Row title="Icon layout" desc="Icons remember where you drag them.">
              <button className="btn btn-sm" onClick={() => window.dispatchEvent(new Event("pos:reset-icons"))}>
                Clean up
              </button>
            </Row>
          </>
        )}
        {sec === "accessibility" && (
          <>
            <h2>Accessibility</h2>
            <Row title="Motion" desc={`Currently ${reducedMotion ? "reduced" : "full"}. System follows your device setting.`}>
              <div className="seg seg-text" role="radiogroup" aria-label="Motion">
                {(["system", "reduced", "full"] as MotionPref[]).map((m) => (
                  <button key={m} role="radio" aria-checked={settings.motion === m} aria-pressed={settings.motion === m} onClick={() => set("motion", m)}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Keyboard" desc="Every app works from the keyboard. ⌘K / Ctrl+K searches everything.">
              <button className="btn btn-sm" onClick={() => os.open("help")}>
                Shortcuts
              </button>
            </Row>
          </>
        )}
        {sec === "sound" && (
          <>
            <h2>Sound</h2>
            <Row title="Interface sounds" desc="Soft cues when windows open and close. Off by default.">
              <Toggle
                on={settings.sound}
                onChange={(v) => {
                  set("sound", v);
                  playCue("click", v);
                }}
                label="Interface sounds"
              />
            </Row>
          </>
        )}
        {sec === "privacy" && (
          <>
            <h2>Privacy</h2>
            <ConsentControls />
            <button className="btn btn-sm btn-ghost set-gap" onClick={() => os.open("privacy")}>
              Read what&rsquo;s measured
            </button>
          </>
        )}
        {sec === "about" && (
          <>
            <h2>About</h2>
            <Row title="iratanshOS 1.0" desc="A personal operating system that runs in your browser.">
              <button className="btn btn-sm" onClick={() => os.open("app:about")}>
                More
              </button>
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
