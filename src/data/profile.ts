import resume from "../Files/resume.pdf";

export const profile = {
  name: "Ishaan Ratanshi",
  firstName: "Ishaan",
  handle: "iratansh",
  initials: "IR",
  role: "Backend, Distributed Systems, Cloud & Applied AI",
  currentPosition: "Software Developer Co-op · Royal Bank of Canada",
  education: {
    school: "University of Alberta",
    degree: "Bachelor of Science in Computer Science",
    expected: "April 2028",
    location: "Edmonton, Alberta",
  },
  /** Hero headline. The <em> part is rendered in the serif accent face. */
  headline: {
    before: "I build software that",
    accent: "holds up",
    after: "across the stack, from distributed backends and cloud infrastructure to the AI agents on top.",
  },
  intro:
    "SDE co-op at RBC, building agentic AI incident tooling and compliance automation. Previously full-stack and data engineering at Elk Valley Resources, moving 600M+ telemetry records a day.",
  openTo:
    "Internships, co-ops, and new-grad roles in backend, full-stack, distributed systems, SRE, cloud infrastructure, and applied AI engineering.",
  email: "iratansh@ualberta.ca",
  links: {
    github: "https://github.com/iratansh",
    linkedin: "https://www.linkedin.com/in/ishaan-ratanshi/",
  },
  resume,
  lastUpdated: "November 2026",
  siteRepo: "https://github.com/iratansh/personal-website",
};

/** Headline numbers from production work. Each one is sourced in experience.ts. */
export const verifiedOutputs = [
  { value: "600M+", label: "telemetry records / day", source: "Elk Valley Resources" },
  { value: "−60%", label: "P99 latency on the Event Hubs ETL", source: "Elk Valley Resources" },
  { value: "<4 s", label: "Vault compliance checks, down from 1 h", source: "RBC" },
  { value: "350+", label: "applications covered by Vault automation", source: "RBC" },
  { value: "65+/s", label: "Webex messages scanned for incident context", source: "RBC" },
  { value: "556", label: "Grafana dashboards under automated backup", source: "Elk Valley Resources" },
];
