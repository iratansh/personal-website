import { motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { useNexus } from "../../lib/nexus";
import { modules, toHref } from "../../lib/routes";
import { Icon, moduleIcon } from "../ui/Icon";
import { profile } from "../../data/profile";

export function Rail() {
  const { route } = useNexus();
  return (
    <aside className="rail" aria-label="Modules">
      <div className="rail-head label">
        <span>Navigate</span>
      </div>
      <nav>
        <ul className="rail-list">
          {modules.map((m) => {
            const active = route.module === m.id;
            return (
              <li key={m.id}>
                <a href={toHref({ module: m.id })} className="rail-item" aria-current={active ? "page" : undefined}>
                  {active && (
                    <motion.span
                      layoutId="rail-active"
                      className="rail-active"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="rail-index mono">{m.index}</span>
                  <Icon name={moduleIcon[m.id]} className="rail-icon" />
                  <span className="rail-label">{m.label}</span>
                  <span className="rail-key kbd" aria-hidden="true">
                    {Number(m.index)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rail-foot" data-track-source="rail">
        <div className="rail-now">
          <span className="label">Currently</span>
          <p>
            <span className="dot pulse" /> SDE Co-op · RBC
          </p>
          <p className="dim mono">Sep 2026 → Apr 2027</p>
        </div>
        <div className="rail-links">
          <a href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <FaGithub />
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
          <a href={`mailto:${profile.email}`} aria-label="Email">
            <Icon name="mail" />
          </a>
          <a href={profile.resume} target="_blank" rel="noreferrer" className="rail-resume mono">
            résumé <Icon name="arrowUpRight" size={12} />
          </a>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { route } = useNexus();
  return (
    <nav className="mobile-nav" aria-label="Modules">
      {modules.map((m) => (
        <a
          key={m.id}
          href={toHref({ module: m.id })}
          className="mobile-nav-item"
          aria-current={route.module === m.id ? "page" : undefined}
        >
          <Icon name={moduleIcon[m.id]} size={18} />
          <span>{m.short ?? m.label.split(" ").pop()}</span>
        </a>
      ))}
    </nav>
  );
}
