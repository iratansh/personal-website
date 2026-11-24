/**
 * Contributions to repositories I don't own. Every entry links to the real pull request or issue,
 * and `status` is what GitHub reports. Never mark anything merged unless GitHub says so:
 *  - "in-progress": the issue is assigned to me and the pull request isn't open yet
 *  - "open": pull request open, awaiting review
 *  - "approved": pull request approved by maintainers, not merged yet
 *  - "merged": merged
 */
export type ContributionStatus = "in-progress" | "open" | "approved" | "merged";

export interface Contribution {
  id: string;
  repo: string;
  repoUrl: string;
  /** Pull request number, or the issue number while there is no pull request yet. */
  number: number;
  kind: "pr" | "issue";
  url: string;
  title: string;
  status: ContributionStatus;
  /** YYYY-MM-DD: merged date if merged, otherwise when the PR or issue was opened. */
  date: string;
  /** "upstream" = a project maintained by others; "team" = a shared team / hackathon repository. */
  relation: "upstream" | "team";
  summary: string;
  tech: string[];
  /** A short code sample that shows what the change does. */
  example?: { lang: string; code: string; caption?: string };
  diff?: { additions: number; deletions: number; files: number };
  /** Registry project that documents this contribution in depth. */
  projectId?: string;
  links?: { label: string; href: string }[];
}

export const STATUS_LABEL: Record<ContributionStatus, string> = {
  "in-progress": "In progress",
  open: "Open",
  approved: "Approved",
  merged: "Merged",
};

export const contributions: Contribution[] = [
  {
    id: "pyrefly-5512",
    repo: "pyrefly-org/pyrefly",
    repoUrl: "https://github.com/pyrefly-org/pyrefly",
    number: 5512,
    kind: "issue",
    url: "https://github.com/pyrefly-org/pyrefly/issues/5512",
    title: "auto be shown with an inlay",
    status: "in-progress",
    date: "2026-11-03",
    relation: "upstream",
    summary:
      "Inlay hints that show the value enum.auto() produces, so a member assigned with auto() displays its actual value in the editor. The issue is assigned to me; the pull request isn't open yet.",
    tech: ["Rust", "Python", "Type checking", "Inlay hints"],
    example: {
      lang: "python",
      code: 'from enum import IntEnum, StrEnum, auto\n\nclass A(StrEnum):\n    A = auto()  # inlay: = "a"\n\nclass B(IntEnum):\n    B = auto()  # inlay: = 1',
      caption: "What the hint shows: StrEnum's auto() is the lowercased member name; IntEnum's starts at 1.",
    },
    links: [{ label: "Related basedpyright discussion", href: "https://github.com/DetachHead/basedpyright/issues/261#issuecomment-2041495457" }],
  },
  {
    id: "aso-5841",
    repo: "Azure/azure-service-operator",
    repoUrl: "https://github.com/Azure/azure-service-operator",
    number: 5841,
    kind: "pr",
    url: "https://github.com/Azure/azure-service-operator/pull/5841",
    title: "feat: add sample Grafana dashboard for ASO metrics",
    status: "approved",
    date: "2026-11-14",
    relation: "upstream",
    summary:
      "Adds a sample Grafana dashboard for Azure Service Operator's Prometheus metrics (overview, reconciliation, work queue, Azure Resource Manager requests, webhooks, controller process) and docs for importing it. Closes issue #4997. Approved by the maintainers.",
    tech: ["Grafana", "Prometheus", "PromQL", "Kubernetes"],
    diff: { additions: 2104, deletions: 0, files: 2 },
    projectId: "aso-dashboard",
    links: [
      { label: "Dashboard JSON (in the PR)", href: "https://github.com/Azure/azure-service-operator/pull/5841/files" },
      { label: "Issue #4997", href: "https://github.com/Azure/azure-service-operator/issues/4997" },
      { label: "ASO metrics docs", href: "https://azure.github.io/azure-service-operator/guide/metrics/" },
    ],
  },
];
