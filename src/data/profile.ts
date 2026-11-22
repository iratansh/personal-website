import resume from "../Files/resume.pdf";

export const profile = {
  name: "Ishaan Ratanshi",
  firstName: "Ishaan",
  handle: "iratansh",
  initials: "IR",
  role: "Infrastructure & Site Reliability Engineering",
  currentPosition: "Software Developer Co-op, SRE · Royal Bank of Canada",
  education: {
    school: "University of Alberta",
    degree: "Bachelor of Science in Computer Science",
    expected: "April 2028",
    location: "Edmonton, Alberta",
  },
  /** Hero headline — the <em> part is rendered in the serif accent face. */
  headline: {
    before: "I build the infrastructure",
    accent: "underneath",
    after: "the software, and the telemetry that keeps it honest.",
  },
  intro:
    "Computer Science at the University of Alberta. Currently an SDE co-op at RBC building AI-assisted incident tooling, Vault compliance automation, and log ingestion pipelines. Previously moved 600M+ telemetry records a day at Elk Valley Resources.",
  interests: [
    "Infrastructure Engineering",
    "Platform Engineering",
    "Site Reliability Engineering",
    "Distributed Systems",
    "Cloud Computing",
    "Backend Engineering",
    "Observability",
    "AI Infrastructure & Developer Tools",
  ],
  openTo:
    "Internships, co-ops, and new-grad roles in infrastructure, platform, SRE, and backend engineering.",
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
