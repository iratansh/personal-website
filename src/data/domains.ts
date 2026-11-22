import type { Domain, DomainId } from "./types";

export const domains: Domain[] = [
  {
    id: "infrastructure",
    label: "Infrastructure",
    short: "INFRA",
    description:
      "Runtimes, containers, and the automation around them — from OpenShift deployments and Vault access-path checks to a container runtime written from scratch in C.",
    hue: "emerald",
  },
  {
    id: "cloud",
    label: "Cloud Computing",
    short: "CLOUD",
    description:
      "AWS and Azure building blocks — ECS Fargate, RDS, ElastiCache, SQS, ALB, Event Hubs — provisioned with Terraform and shipped through CI/CD.",
    hue: "cyan",
  },
  {
    id: "distributed",
    label: "Distributed Systems",
    short: "DIST",
    description:
      "Queues, backpressure, idempotency, and recovery: what happens between services when load spikes or a process dies mid-write.",
    hue: "blue",
  },
  {
    id: "observability",
    label: "Observability",
    short: "OBS",
    description:
      "Metrics, logs, and dashboards that let operators answer questions quickly — OpenTelemetry, Prometheus, Loki, Grafana, and the ELK stack.",
    hue: "emerald",
  },
  {
    id: "backend",
    label: "Backend Engineering",
    short: "BACK",
    description:
      "Reactive and concurrent services in Java, Go, and Python — transactional correctness, caching, and clean API contracts.",
    hue: "cyan",
  },
  {
    id: "ai",
    label: "AI Engineering",
    short: "AI",
    description:
      "AI infrastructure and developer tools — MCP integrations for incident investigation, plus ML inference and robotics research.",
    hue: "violet",
  },
];

export const domainById = Object.fromEntries(domains.map((d) => [d.id, d])) as Record<
  DomainId,
  Domain
>;
