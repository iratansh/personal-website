import type { Project } from "./types";

/**
 * Project registry. Descriptions, architecture, and numbers are taken from each
 * repository's README and from the resume. Benchmarks keep their caveats in `context`.
 */
export const projects: Project[] = [
  {
    id: "telemetry-collector",
    name: "Telemetry Collector",
    tagline: "Fault-tolerant OpenTelemetry log collector with a write-ahead log and admission control.",
    kind: "pipeline",
    language: "Go",
    domains: ["observability", "distributed", "sre", "cloud"],
    stack: [
      "Go",
      "OpenTelemetry",
      "OTLP/gRPC",
      "Protocol Buffers",
      "Prometheus",
      "Grafana Loki",
      "Grafana",
      "Docker",
      "Kubernetes (GKE)",
      "Terraform",
    ],
    repo: "https://github.com/iratansh/Telemetry-Collector",
    overview:
      "A Go collector for OpenTelemetry logs. Requests are written to a write-ahead log, batched by a bounded worker pool, and exported to Loki with retries. Prometheus and Grafana watch the collector itself, locally or on GKE.",
    problem:
      "When backends slow down or the collector crashes, logs are exactly what you can't afford to lose. The goal: at-least-once delivery across restarts, and overload pushed back to senders instead of absorbed into memory.",
    architecture: {
      caption: "Ingest path (top) and the collector's own observability path (bottom).",
      nodes: [
        { id: "producer", label: "OTLP producer", sub: "gRPC :4317", col: 0, row: 0, tone: "client" },
        { id: "admission", label: "Admission", sub: "validate · byte budget", col: 1, row: 0, tone: "service" },
        { id: "wal", label: "Write-ahead log", sub: "append + group sync", col: 2, row: 0, tone: "store" },
        { id: "queue", label: "Bounded queue", sub: "capacity 128", col: 3, row: 0, tone: "queue" },
        { id: "workers", label: "Worker pool", sub: "batch · retry", col: 4, row: 0, tone: "service" },
        { id: "metrics", label: "Collector metrics", sub: ":8888/metrics", col: 1, row: 1, tone: "observe" },
        { id: "prom", label: "Prometheus", col: 2, row: 1, tone: "observe" },
        { id: "grafana", label: "Grafana", sub: "provisioned dashboard", col: 3, row: 1, tone: "observe" },
        { id: "loki", label: "Loki", sub: "OTLP/HTTP", col: 4, row: 1, tone: "store" },
      ],
      edges: [
        { from: "producer", to: "admission", label: "OTLP" },
        { from: "admission", to: "wal" },
        { from: "wal", to: "queue" },
        { from: "queue", to: "workers" },
        { from: "workers", to: "loki", label: "export" },
        { from: "metrics", to: "prom", label: "scrape" },
        { from: "prom", to: "grafana" },
        { from: "loki", to: "grafana" },
      ],
    },
    decisions: [
      {
        title: "Acknowledge only after the WAL",
        body: "Nothing is acked until it's appended and synced, so acked data survives a crash. On restart the WAL is scanned and pending work replayed through the same worker pool.",
      },
      {
        title: "Group sync, not per-record fsync",
        body: "Durability puts fsync on the request path. Syncing every 2 ms or 32 records, whichever comes first, trades a small bounded delay for far fewer syncs under load.",
      },
      {
        title: "Reject, don't buffer",
        body: "Queue, workers, and pending bytes are all capped, so overload returns RESOURCE_EXHAUSTED instead of growing latency or memory. In a 50,000-event burst: 16,000 accepted, 340 requests rejected, no other errors.",
      },
      {
        title: "Prove recovery, don't assume it",
        body: "A benchmark kills a child process mid-write, then measures WAL scan and replay in the parent. Queue depth, heap, and goroutines are sampled every 50 ms so each run carries its own resource profile.",
      },
    ],
    metrics: [
      { value: "8,000/s", label: "sustained log records", context: "On GKE. Local baseline: 2,000/s." },
      { value: "21 ms", label: "P99 request latency", context: "Same GKE run." },
      { value: "66 ms", label: "to rebuild 10,000 pending requests on restart" },
      { value: "1", label: "max queue depth across 1,200 samples", context: "Local paced run." },
    ],
  },
  {
    id: "papertrade",
    name: "PaperTrade",
    tagline: "Reactive paper-trading platform with live market data and idempotent order execution.",
    kind: "platform",
    language: "Java",
    domains: ["backend", "distributed", "fullstack", "cloud"],
    stack: [
      "Java 21",
      "Spring Boot 3",
      "Spring WebFlux",
      "R2DBC",
      "PostgreSQL",
      "Flyway",
      "Redis",
      "SSE",
      "Finnhub WebSocket",
      "AWS SQS",
      "React",
      "TypeScript",
      "Terraform",
      "ECS Fargate",
      "Docker",
    ],
    repo: "https://github.com/iratansh/PaperTrade",
    overview:
      "Paper trading with real US equities and $100,000 of play money. A reactive Java backend (WebFlux, R2DBC) handles market and limit orders, streams live prices over SSE, and fires watchlist alerts. Deploys to AWS through Terraform.",
    problem:
      "Trading looks simple until two requests touch the same account. Balance, holdings, and the ledger must move together, a retry must never fill twice, and live prices must reach every browser without one provider connection per user.",
    architecture: {
      caption: "One shared market-data stream fans out to clients and the alert engine; orders commit under a short-lived row lock.",
      nodes: [
        { id: "spa", label: "React SPA", sub: "TypeScript · Vite", col: 0, row: 1, tone: "client" },
        { id: "redis", label: "Redis", sub: "quote cache-aside", col: 1, row: 0, tone: "store" },
        { id: "api", label: "WebFlux API", sub: "Netty · reactive JWT", col: 1, row: 1, tone: "service" },
        { id: "sink", label: "Multicast sink", sub: "SSE + price alerts", col: 1, row: 2, tone: "service" },
        { id: "orderq", label: "Order queue", sub: "SQS · DB poller locally", col: 2, row: 0, tone: "queue" },
        { id: "engine", label: "Order engine", sub: "FOR UPDATE · idempotent", col: 2, row: 1, tone: "service" },
        { id: "finnhub", label: "Finnhub", sub: "WebSocket stream", col: 2, row: 2, tone: "external" },
        { id: "pg", label: "PostgreSQL", sub: "R2DBC · Flyway", col: 3, row: 1, tone: "store" },
      ],
      edges: [
        { from: "spa", to: "api", label: "REST + SSE" },
        { from: "api", to: "engine" },
        { from: "engine", to: "pg", label: "4-table commit" },
        { from: "orderq", to: "engine", label: "fill worker" },
        { from: "api", to: "redis" },
        { from: "finnhub", to: "sink" },
        { from: "sink", to: "api", label: "fan-out" },
      ],
    },
    decisions: [
      {
        title: "Locks never span network I/O",
        body: "The price is fetched before the transaction opens, so the FOR UPDATE row lock covers only fast local writes. Balance, holdings, and ledger commit together or not at all, and retries never double-fill.",
      },
      {
        title: "One upstream socket, many subscribers",
        body: "A single Finnhub WebSocket feeds a multicast sink that fans out to every SSE client and the alert engine, instead of one provider connection per user.",
      },
      {
        title: "Swappable providers",
        body: "Market data, price history, and the order queue sit behind interfaces: Finnhub or Twelve Data for history, a local DB poller or SQS for orders.",
      },
      {
        title: "Capture, don't compute",
        body: "A scheduled job snapshots portfolio value, so growth charts show real history instead of a reconstruction from today's prices.",
      },
    ],
    metrics: [
      { value: "<40 ms", label: "P95 order commit latency" },
      { value: "−99%", label: "upstream quote calls", context: "Redis cache-aside." },
      { value: "4", label: "tables written atomically per fill" },
    ],
  },
  {
    id: "shrinkr",
    name: "Shrinkr",
    tagline: "Distributed URL shortener with a read-through cache and asynchronous click analytics.",
    kind: "service",
    language: "Go",
    domains: ["backend", "distributed", "cloud", "fullstack"],
    stack: [
      "Go",
      "Gin",
      "PostgreSQL (RDS)",
      "Redis (ElastiCache)",
      "AWS SQS",
      "ECS Fargate",
      "ALB",
      "ECR",
      "CloudWatch",
      "GitHub Actions",
      "Docker Compose",
      "Kubernetes",
      "Helm",
      "React",
      "TypeScript",
    ],
    repo: "https://github.com/iratansh/Shrinkr",
    overview:
      "A URL shortener: a Go API and a Go analytics worker on ECS Fargate behind an ALB. Redirects hit Redis first, then PostgreSQL; each click goes to SQS for the worker to record.",
    problem:
      "The redirect is the hot path: one cache read, then a 302. Analytics must never slow it down, or take it out when the analytics store is unhealthy.",
    architecture: {
      caption: "Redirects stay synchronous and cache-first; analytics move off the hot path through SQS.",
      nodes: [
        { id: "browser", label: "Browser", sub: "React dashboard", col: 0, row: 1, tone: "client" },
        { id: "alb", label: "ALB", sub: "HTTP :80", col: 1, row: 1, tone: "service" },
        { id: "api", label: "Go API", sub: "Gin · ECS Fargate", col: 2, row: 1, tone: "service" },
        { id: "redis", label: "ElastiCache Redis", sub: "code → long_url", col: 3, row: 0, tone: "store" },
        { id: "rds", label: "RDS PostgreSQL", sub: "urls · clicks", col: 3, row: 1, tone: "store" },
        { id: "sqs", label: "SQS", sub: "shrinkr-clicks", col: 3, row: 2, tone: "queue" },
        { id: "worker", label: "Go worker", sub: "long-poll consumer", col: 4, row: 2, tone: "service" },
      ],
      edges: [
        { from: "browser", to: "alb" },
        { from: "alb", to: "api" },
        { from: "api", to: "redis", label: "GET code" },
        { from: "api", to: "rds", label: "on miss" },
        { from: "api", to: "sqs", label: "click event" },
        { from: "sqs", to: "worker" },
        { from: "worker", to: "rds", label: "INSERT clicks" },
      ],
    },
    decisions: [
      {
        title: "Read-through cache, Postgres fallback",
        body: "Redirects read Redis first. On a miss, or when Redis is degraded, the API reads PostgreSQL and repopulates the cache.",
      },
      {
        title: "Delete after durable write",
        body: "The worker deletes an SQS message only after the click row is inserted: at-least-once delivery, with no analytics writes on the redirect path.",
      },
      {
        title: "Least-privilege networking",
        body: "The worker has no inbound port, and the API only accepts traffic from the load balancer.",
      },
      {
        title: "Runs without AWS",
        body: "With SQS disabled, the API writes clicks straight to PostgreSQL, so the whole system runs under Docker Compose.",
      },
    ],
    metrics: [
      {
        value: "<5 ms",
        label: "redirects served from the ElastiCache read-through cache",
        context: "Cache hits skip the database entirely; click events go to SQS so bursts never block a redirect on RDS writes.",
      },
    ],
  },
  {
    id: "aso-dashboard",
    name: "ASO Grafana Dashboard",
    tagline: "Upstream contribution: a ready-to-use Grafana dashboard for Azure Service Operator.",
    kind: "upstream",
    language: "Grafana JSON · PromQL",
    domains: ["observability", "cloud", "sre"],
    stack: ["Grafana", "Prometheus", "PromQL", "Kubernetes", "Azure Service Operator"],
    repo: "https://github.com/Azure/azure-service-operator",
    links: [
      {
        label: "Dashboard JSON",
        href: "https://github.com/Azure/azure-service-operator/blob/main/v2/config/grafana/azure-service-operator.json",
      },
      { label: "ASO metrics docs", href: "https://azure.github.io/azure-service-operator/guide/metrics/" },
    ],
    overview:
      "Azure Service Operator manages Azure resources from Kubernetes and exposes Prometheus metrics, but shipped no dashboard. This upstream contribution adds one: 28 charts across six sections.",
    problem:
      "Operators had the raw metrics but had to build panels from scratch to answer basic questions: are reconciles failing, is the queue backing up, is Azure throttling us?",
    architecture: {
      caption: "Controllers emit Prometheus metrics; the dashboard turns them into six operational views.",
      nodes: [
        { id: "ctrl", label: "ASO controllers", sub: "reconcile loops", col: 0, row: 0, tone: "service" },
        { id: "arm", label: "Azure Resource Manager", sub: "requests · 429s", col: 0, row: 1, tone: "external" },
        { id: "metrics", label: "/metrics", sub: "Prometheus format", col: 1, row: 0, tone: "observe" },
        { id: "prom", label: "Prometheus", sub: "data source", col: 2, row: 0, tone: "observe" },
        { id: "dash", label: "Grafana dashboard", sub: "28 charts · 6 sections", col: 3, row: 0, tone: "observe" },
      ],
      edges: [
        { from: "ctrl", to: "arm" },
        { from: "ctrl", to: "metrics" },
        { from: "metrics", to: "prom", label: "scrape" },
        { from: "prom", to: "dash", label: "PromQL" },
      ],
    },
    decisions: [
      {
        title: "Overview first",
        body: "Six tiles up top: reconcile rate, error ratio, queue depth, Azure request rate, throttling, and panics.",
      },
      {
        title: "One section per failure mode",
        body: "Reconciliation, work queue, Azure Resource Manager, webhooks, and controller process each answer one class of question.",
      },
      {
        title: "Thresholds that mean something",
        body: "Yellow at 5% errors or queue depth 50; red at 20%, depth 200, any Azure throttling, or any panic.",
      },
      {
        title: "Readable at high cardinality",
        body: "Most breakdowns show only the top 10 controllers or resource types.",
      },
    ],
    metrics: [
      { value: "28", label: "charts" },
      { value: "6", label: "sections" },
    ],
  },
  {
    id: "marketpulse",
    name: "MarketPulse",
    tagline: "Streaming market analytics: Kafka ticks, windowed VWAP in Flink, and a TimescaleDB time-series store.",
    kind: "pipeline",
    language: "Java",
    domains: ["distributed", "observability", "cloud"],
    stack: [
      "Java 17",
      "Apache Kafka",
      "Apache Flink",
      "TimescaleDB",
      "PostgreSQL",
      "Grafana",
      "Docker Compose",
      "Terraform",
      "AWS EC2",
    ],
    repo: "https://github.com/iratansh/MarketPulse",
    overview:
      "A streaming pipeline for simulated equities. A Java producer publishes ticks to Kafka, a Flink job computes per-ticker VWAP over tumbling windows, and TimescaleDB stores the results for Grafana. Runs under Docker Compose or on EC2 via Terraform.",
    problem:
      "VWAP is a running aggregate per symbol over an unbounded stream. Producer, processor, and store each had to be tunable on their own, and dashboards needed compact rollups, not raw results.",
    architecture: {
      caption: "Ticks flow left to right through Kafka and Flink; Terraform provisions the host the containers run on.",
      nodes: [
        { id: "producer", label: "Java producer", sub: "lz4 · batched sends", col: 0, row: 0, tone: "client" },
        { id: "kafka", label: "Kafka", sub: "market.ticks · keyed by ticker", col: 1, row: 0, tone: "queue" },
        { id: "flink", label: "Flink job", sub: "tumbling-window VWAP", col: 2, row: 0, tone: "service" },
        { id: "tsdb", label: "TimescaleDB", sub: "vwap_metrics hypertable", col: 3, row: 0, tone: "store" },
        { id: "grafana", label: "Grafana", col: 4, row: 0, tone: "observe" },
        { id: "tf", label: "Terraform", sub: "VPC · security group", col: 0, row: 1, tone: "external" },
        { id: "ec2", label: "EC2 host", sub: "Docker Compose", col: 1, row: 1, tone: "service" },
        { id: "cagg", label: "vwap_1min", sub: "continuous aggregate", col: 3, row: 1, tone: "store" },
      ],
      edges: [
        { from: "producer", to: "kafka", label: "JSON ticks" },
        { from: "kafka", to: "flink" },
        { from: "flink", to: "tsdb", label: "JDBC batches" },
        { from: "tsdb", to: "cagg", label: "rollup" },
        { from: "tsdb", to: "grafana" },
        { from: "tf", to: "ec2", label: "provisions" },
      ],
    },
    decisions: [
      {
        title: "Steady-rate producer",
        body: "A task fires every 100 ms with a tenth of the per-second target (10,000/s by default) and reports what was actually acknowledged.",
      },
      {
        title: "Ticker as the partition key",
        body: "Kafka and Flink both key by ticker, so each symbol's ticks stay ordered and window state stays per symbol.",
      },
      {
        title: "Batch at both ends",
        body: "The producer uses lz4, a 5 ms linger, and 64 KB batches. The JDBC sink flushes every 100 rows or every second, with up to three retries.",
      },
      {
        title: "Let the database roll up",
        body: "A TimescaleDB continuous aggregate keeps one-minute buckets, so dashboards read rollups instead of raw window output.",
      },
    ],
    metrics: [],
    metricsNote: "No published benchmarks yet. 10,000 messages/s is a configured target, not a measurement.",
  },
  {
    id: "evaluate",
    name: "Evaluate",
    tagline: "AI mock-interview platform with LLM question generation, answer scoring, and speech.",
    kind: "application",
    language: "Java · TypeScript",
    domains: ["fullstack", "backend", "ai"],
    stack: [
      "Java 17",
      "Spring Boot 3",
      "Spring Data JPA",
      "Spring WebFlux (WebClient)",
      "PostgreSQL",
      "Ollama (llama3.2)",
      "Azure Speech Services",
      "Azure Blob Storage",
      "Next.js 14",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Docker Compose",
      "GitHub Actions",
      "JUnit 5",
      "MockMvc",
    ],
    repo: "https://github.com/iratansh/Evaluate",
    overview:
      "Mock technical interviews in five domains. A Spring Boot backend generates questions with a local Ollama model, grounded in a domain knowledge base, and scores answers 0–10 with feedback. Answers can be typed or spoken; the Next.js frontend runs timed sessions.",
    problem:
      "The app depends on an LLM, a speech service, and blob storage, any of which can be slow or missing on a developer's machine. A full session still has to work.",
    architecture: {
      caption: "The API grounds prompts in a local knowledge base; every external dependency has a fallback.",
      nodes: [
        { id: "web", label: "Next.js app", sub: "timed session · avatar", col: 0, row: 1, tone: "client" },
        { id: "api", label: "Spring Boot API", sub: "REST · JPA", col: 1, row: 1, tone: "service" },
        { id: "rag", label: "Knowledge base", sub: "markdown topic sections", col: 2, row: 0, tone: "service" },
        { id: "llm", label: "Ollama", sub: "llama3.2 · 60 s timeout", col: 3, row: 0, tone: "external" },
        { id: "pg", label: "PostgreSQL", sub: "sessions · questions", col: 2, row: 1, tone: "store" },
        { id: "speech", label: "Azure Speech", sub: "STT · TTS", col: 2, row: 2, tone: "external" },
        { id: "blob", label: "Audio storage", sub: "Azure Blob or local", col: 3, row: 2, tone: "store" },
      ],
      edges: [
        { from: "web", to: "api", label: "REST" },
        { from: "api", to: "rag", label: "context" },
        { from: "rag", to: "llm", label: "grounded prompt" },
        { from: "api", to: "pg" },
        { from: "api", to: "speech" },
        { from: "speech", to: "blob", label: "audio" },
      ],
    },
    decisions: [
      {
        title: "Lightweight retrieval",
        body: "Each domain is a markdown file split into sections; a question pulls in the sections with the most keyword overlap. A new domain is just a new file.",
      },
      {
        title: "Degrade, don't fail",
        body: "LLM calls time out after 60 s and fall back to pre-written questions and a heuristic scorer. Speech is optional; blob storage falls back to local disk.",
      },
      {
        title: "Parse defensively, score honestly",
        body: "Small-model output is parsed section by section, with fallbacks when the format drifts. The prompt scores off-topic or incoherent answers 0–1.",
      },
      {
        title: "One command to run",
        body: "Docker Compose starts the backend, frontend, and Ollama. CI runs tests, lint, type checks, and both Docker builds.",
      },
    ],
    metrics: [
      {
        value: "≤2,000 ms",
        label: "to deliver context-aware feedback",
        context: "Spring WebFlux calls local Ollama inference with retrieval-augmented prompts. Scoring quality depends on the local model.",
      },
    ],
  },
];

export const projectById = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<string, Project>;
