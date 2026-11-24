import { useState } from "react";
import { ArrowUpRight, Check, Copy, FileText, Mail, Send } from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { profile } from "../../data/profile";
import { useOS } from "../store";
import { track } from "../../analytics";

export default function Contact() {
  const os = useOS();
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      track("contact_copy_email", { source: "contact" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      os.toast("Clipboard unavailable", profile.email);
    }
  };
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(subject || "Hello from your portfolio")}&body=${encodeURIComponent(body)}`;

  return (
    <div className="contact" data-track-source="contact">
      <section className="contact-main">
        <span className="hl-k">Get in touch</span>
        <p className="contact-open">Email is the fastest way to reach me. GitHub and LinkedIn are below, along with my résumé.</p>
        <div className="contact-email">
          <Mail size={18} />
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <button className="btn btn-sm" onClick={copy} aria-live="polite">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <ul className="contact-links">
          <li>
            <a href={profile.links.github} target="_blank" rel="noreferrer">
              <FaGithub /> <span>GitHub</span> <em>github.com/{profile.handle}</em> <ArrowUpRight size={14} />
            </a>
          </li>
          <li>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer">
              <FaLinkedinIn /> <span>LinkedIn</span> <em>in/ishaan-ratanshi</em> <ArrowUpRight size={14} />
            </a>
          </li>
          <li>
            <button onClick={() => os.open("resume", { source: "contact" })}>
              <FileText size={15} /> <span>Résumé</span> <em>PDF · updated {profile.lastUpdated}</em> <ArrowUpRight size={14} />
            </button>
          </li>
        </ul>
      </section>
      <form
        className="contact-compose"
        onSubmit={(e) => {
          e.preventDefault();
          track("contact_compose");
          window.location.href = mailto;
        }}
      >
        <span className="hl-k">Compose · sends through your mail app</span>
        <label>
          <span>To</span>
          <input value={profile.email} readOnly />
        </label>
        <label>
          <span>Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Co-op opportunity, a question, a hello…" />
        </label>
        <label className="contact-msg">
          <span>Message</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message here." rows={6} />
        </label>
        <div className="contact-foot">
          <small>Nothing is sent from this page. It opens your own mail client with this filled in.</small>
          <button className="btn btn-primary" type="submit">
            <Send size={14} /> Open in mail app
          </button>
        </div>
      </form>
    </div>
  );
}
