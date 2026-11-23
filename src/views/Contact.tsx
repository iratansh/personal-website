import { useState } from "react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { useNexus } from "../lib/nexus";
import { profile } from "../data/profile";
import { Icon, type IconName } from "../components/ui/Icon";
import { Reveal, ViewHeader } from "../components/ui/Primitives";
import { toHref } from "../lib/routes";
import { track } from "../analytics";

export default function Contact() {
  const { toast } = useNexus();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      track("contact_copy_email", { source: "contact" });
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      toast("Email address copied to clipboard");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Clipboard unavailable: " + profile.email, "warn");
    }
  };

  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(subject || "Hello from your portfolio")}&body=${encodeURIComponent(body)}`;

  const channels: { label: string; value: string; href: string; icon: React.ReactNode; ext?: boolean }[] = [
    { label: "GitHub", value: `github.com/${profile.handle}`, href: profile.links.github, icon: <FaGithub />, ext: true },
    { label: "LinkedIn", value: "in/ishaan-ratanshi", href: profile.links.linkedin, icon: <FaLinkedinIn />, ext: true },
    {
      label: "Résumé",
      value: "PDF · updated " + profile.lastUpdated,
      href: profile.resume,
      icon: <Icon name={"file" as IconName} />,
      ext: true,
    },
  ];

  return (
    <div className="view contact">
      <ViewHeader
        index="06"
        kicker="Contact"
        title="Get in touch."
        lede={profile.openTo}
      />

      <div className="contact-grid">
        <Reveal className="contact-primary frame">
          <span className="label">Email</span>
          <a className="contact-email" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <div className="contact-email-actions">
            <button className="btn" onClick={copy}>
              <Icon name={copied ? "check" : "copy"} /> {copied ? "Copied" : "Copy address"}
            </button>
            <a className="btn btn-ghost" href={`mailto:${profile.email}`}>
              Open mail client <Icon name="arrowUpRight" />
            </a>
          </div>

          <ul className="channels">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} target={c.ext ? "_blank" : undefined} rel="noreferrer">
                  <span className="channel-icon">{c.icon}</span>
                  <span className="label">{c.label}</span>
                  <span className="channel-value mono">{c.value}</span>
                  <Icon name="arrowUpRight" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="contact-compose frame" delay={0.08}>
          <div className="compose-head">
            <span className="label">Write a message · opens your mail client</span>
            <span className="compose-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              track("contact_compose");
              window.location.href = mailto;
            }}
          >
            <label className="field">
              <span className="label">To</span>
              <input value={profile.email} readOnly tabIndex={-1} />
            </label>
            <label className="field">
              <span className="label">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Co-op opportunity, a question, a hello…" />
            </label>
            <label className="field field-body">
              <span className="label">Message</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="Write your message here." />
            </label>
            <div className="compose-foot">
              <span className="mono dim">{body.length} chars · no data leaves this page until you send</span>
              <button className="btn btn-primary" type="submit">
                Send <Icon name="arrowRight" className="nudge" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>

      <footer className="site-foot mono">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="dim">Last updated {profile.lastUpdated}</span>
        <a href={toHref({ module: "privacy" })} className="link-arrow">
          privacy
        </a>
        <a href={profile.siteRepo} target="_blank" rel="noreferrer" className="link-arrow">
          view source <Icon name="arrowUpRight" />
        </a>
      </footer>
    </div>
  );
}
