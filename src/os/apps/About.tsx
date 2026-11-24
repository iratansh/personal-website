import { useRef } from "react";
import { FaGithub } from "react-icons/fa6";
import { profile } from "../../data/profile";
import { MarkTile } from "../shell/MenuBar";
import { useOS } from "../store";
import { track } from "../../analytics";

const STACK: [string, string][] = [
  ["Interface", "React 18 · TypeScript"],
  ["Build", "Vite · GitHub Actions → GitHub Pages"],
  ["Motion", "Framer Motion"],
  ["Documents", "pdf.js"],
  ["Graphs", "d3-force · hand-built SVG"],
  ["Icons", "Lucide · custom-drawn app icons"],
  ["Analytics", "Cloudflare Web Analytics · GoatCounter (cookie-free)"],
];

export default function About() {
  const os = useOS();
  const clicks = useRef(0);
  return (
    <div className="about-os">
      <MarkTile size={92} />
      <h2>iratanshOS</h2>
      <button
        className="about-ver"
        onClick={() => {
          if (++clicks.current === 5) {
            clicks.current = 0;
            track("easter_egg", { name: "about-version" });
            os.toast("You found the build number", "1.0 (it was always 1.0). Try the Konami code next.");
          }
        }}
      >
        Version 1.0
      </button>
      <p className="about-lede">
        {profile.name}&rsquo;s portfolio, built as a small operating system. Projects are files, the résumé is a PDF you can
        open, and the infrastructure work lives in an app of its own.
      </p>
      <dl className="about-stack">
        {STACK.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="about-note">
        Everything runs in your browser on static hosting. There&rsquo;s no backend, and the Terminal is a simulation with no access
        to your computer.
      </p>
      <a className="btn btn-sm" href={profile.siteRepo} target="_blank" rel="noreferrer">
        <FaGithub /> Source on GitHub
      </a>
    </div>
  );
}
