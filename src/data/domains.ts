import type { Domain, DomainId } from "./types";

export const domains: Domain[] = [
  {
    id: "backend",
    label: "Backend Engineering",
    short: "BACK",
    description:
      "Reactive and concurrent services in Java, Go, and Python: transactional correctness, caching, idempotent APIs, and data pipelines.",
    hue: "cyan",
  },
  {
    id: "fullstack",
    label: "Full-Stack",
    short: "FULL",
    description:
      "Product end to end: React, Next.js, and SvelteKit front ends on top of the services and databases that back them.",
    hue: "blue",
  },
  {
    id: "distributed",
    label: "Distributed Systems",
    short: "DIST",
    description:
      "Queues, streams, backpressure, idempotency, and recovery: what happens between services when load spikes or a process dies mid-write.",
    hue: "blue",
  },
  {
    id: "sre",
    label: "Site Reliability",
    short: "SRE",
    description:
      "Keeping production boring: incident tooling, compliance automation, admission control, and failure handling designed in rather than bolted on.",
    hue: "emerald",
  },
  {
    id: "cloud",
    label: "Cloud Infrastructure",
    short: "CLOUD",
    description:
      "GCP, Kubernetes, AWS, and Azure, provisioned with Terraform and Helm: from GKE deployments to ECS Fargate services.",
    hue: "cyan",
  },
  {
    id: "observability",
    label: "Observability",
    short: "OBS",
    description:
      "Metrics, logs, and dashboards that let operators answer questions quickly: OpenTelemetry, Prometheus, Loki, Grafana, and the ELK stack.",
    hue: "emerald",
  },
  {
    id: "ai",
    label: "Applied & Agentic AI",
    short: "AI",
    description:
      "AI that does real work: MCP agents for incident investigation, LLM-backed products, and reinforcement learning and vision-language models for robotics.",
    hue: "violet",
  },
];

export const domainById = Object.fromEntries(domains.map((d) => [d.id, d])) as Record<
  DomainId,
  Domain
>;
