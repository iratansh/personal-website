import { projectById } from "../../data/projects";
import { noteById } from "../../data/knowledge";
import { contributions } from "../../data/opensource";
import type { AppProps } from "../types";
import { ProjectDoc } from "./reader/ProjectDoc";
import { AboutDoc, ContributionDoc, ExperienceDoc, HelpDoc, NoteDoc, OssReadme, SkillsDoc } from "./reader/docs";
import { PrivacyDoc } from "./reader/PrivacyDoc";

/** Renders any document node. The argument is the node id, e.g. "project:shrinkr" or "about". */
export default function Reader({ arg = "" }: AppProps) {
  const [kind, id] = arg.includes(":") ? [arg.slice(0, arg.indexOf(":")), arg.slice(arg.indexOf(":") + 1)] : [arg, ""];

  if (kind === "project" && projectById[id]) return <ProjectDoc p={projectById[id]} />;
  if (kind === "oss") {
    const c = contributions.find((x) => x.id === id);
    if (c) return <ContributionDoc c={c} />;
  }

  const body = (() => {
    switch (kind) {
      case "note":
        return noteById[id] ? <NoteDoc note={noteById[id]} /> : null;
      case "about":
        return <AboutDoc />;
      case "skills":
        return <SkillsDoc />;
      case "experience":
        return <ExperienceDoc />;
      case "oss-readme":
        return <OssReadme />;
      case "help":
        return <HelpDoc />;
      case "privacy":
        return <PrivacyDoc />;
      default:
        return null;
    }
  })();

  return <div className="doc-scroll">{body ?? <p className="doc doc-missing">This document doesn&rsquo;t exist.</p>}</div>;
}
