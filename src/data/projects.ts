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
    domains: ["observability", "distributed", "infrastructure"],
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
      "A Go collector for OpenTelemetry logs, built to study concurrency, backpressure, and failure handling. Logs arrive over OTLP/gRPC, are admitted into a custom write-ahead log, batched by a bounded worker pool, and exported to Loki with retries. The collector exposes its own metrics to Prometheus, and the whole stack comes with provisioned Grafana dashboards. A disposable GKE deployment adds Kubernetes pod and node state metrics and real pod logs through a per-node log agent.",
    problem:
      "A telemetry pipeline sits in the blast radius of every incident: when downstream backends slow down or the collector crashes, logs are exactly what you can't afford to lose. The goal was at-least-once delivery across process restarts, with overload pushed back to senders explicitly instead of absorbed by unbounded memory growth.",
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
    challenges: [
      "Making durability cheap enough: every admitted request is appended to the WAL, so fsync cost lands directly on request latency.",
      "Keeping memory bounded under bursts — the queue, the worker count, and the pending-byte budget are all capped, and overload must surface to senders as RESOURCE_EXHAUSTED rather than as latency or OOM.",
      "Proving recovery actually works: a benchmark seeds durable WAL records in a child process that exits without closing the WAL, then measures scan and replay in the parent.",
    ],
    decisions: [
      {
        title: "Write-ahead log before the queue",
        body: "Requests are acknowledged only after a WAL append and sync, so anything acknowledged survives a crash. On restart the WAL is scanned, frames validated, Protobuf decoded, and pending work replayed through the same worker pool; checkpoints mark records as exported.",
      },
      {
        title: "Group sync instead of per-record fsync",
        body: "The WAL syncs every 2 ms or every 32 records, whichever comes first, and a batch's checkpoint records are written together behind a single sync. This trades a small bounded delay for far fewer syncs under load.",
      },
      {
        title: "Reject, don't buffer",
        body: "A bounded jobs channel, a fixed export worker pool, and a byte budget mean overload returns RESOURCE_EXHAUSTED to the sender. In an unpaced 50,000-event burst the collector accepted 16,000 events and rejected 340 requests with no other RPC errors — overload stayed visible and bounded.",
      },
      {
        title: "The collector observes itself",
        body: "Queue depth, pending bytes, goroutines, heap, and RSS are exported to Prometheus; the load driver samples them every 50 ms so each benchmark run carries its own resource profile.",
      },
    ],
    metrics: [
      {
        value: "8,000/s",
        label: "sustained log records",
        context: "GKE deployment. The earlier local baseline (Apple M2 Pro) was 2,000 events/s paced for 60 s with no rejections.",
      },
      { value: "21 ms", label: "P99 request latency", context: "Same GKE run. Local baseline: 17.3 ms P99." },
      {
        value: "66 ms",
        label: "to reconstruct 10,000 pending requests on restart",
        context: "WAL scan, frame validation, and Protobuf decode before replay through the worker pool.",
      },
      { value: "1", label: "max queue depth across 1,200 samples", context: "Local paced run · heap 15.5 MB, 28 goroutines, RSS 47.2 MB." },
    ],
  },
  {
    id: "papertrade",
    name: "PaperTrade",
    tagline: "Reactive paper-trading platform with live market data and idempotent order execution.",
    kind: "platform",
    language: "Java",
    domains: ["backend", "distributed", "cloud"],
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
      "A paper-trading platform for practicing with real US equities and $100,000 of play money. The backend is reactive end to end — Netty, R2DBC, and WebClient — with JWT auth, market and limit orders, a queued order book for after-hours and resting limit orders, live prices streamed over Server-Sent Events, watchlist price alerts, and portfolio snapshots for real historical growth charts. Deployable to AWS (ECS Fargate, RDS, ElastiCache, SQS, ALB) through Terraform and GitHub Actions.",
    problem:
      "Trading looks simple until two requests touch the same account at once. Balance, holdings, and the ledger have to move together, a retried submission must never fill twice, and live prices need to reach every open browser without opening a provider connection per user.",
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
    challenges: [
      "Keeping lock windows short in a reactive stack where a naïve order path would hold a row lock across a network call to the price provider.",
      "Atomic writes to balance, holdings, and the ledger across four tables, with retries that never double-fill.",
      "Carrying the security context across thread hops — reactive requests don't stay on one thread, so ThreadLocal-based security doesn't work.",
      "Portfolio history can't be reconstructed from today's prices; it has to be captured as it happens.",
    ],
    decisions: [
      {
        title: "Locks never span network I/O",
        body: "The market price is fetched before the order transaction opens, so the pessimistic FOR UPDATE lock on the account is held only for fast local writes.",
      },
      {
        title: "One upstream socket, many subscribers",
        body: "A single Finnhub WebSocket feeds a reactive multicast sink that fans out to every SSE client and to the price-alert engine (Observer pattern), instead of one provider connection per user.",
      },
      {
        title: "Interfaces at every provider boundary",
        body: "MarketDataService, HistoryProvider, and OrderQueue are interfaces with swappable implementations — Finnhub vs. Twelve Data for history, a local DB poller vs. SQS for the order queue.",
      },
      {
        title: "Capture, don't compute",
        body: "A scheduled job snapshots total portfolio value so growth charts reflect real history rather than a reconstruction from current prices.",
      },
    ],
    metrics: [
      { value: "<40 ms", label: "P95 order commit latency" },
      { value: "−99%", label: "upstream quote calls", context: "Redis cache-aside in front of the quote provider." },
      { value: "4", label: "tables written atomically per fill", context: "Balance, holdings, and ledger writes commit together or not at all." },
    ],
  },
  {
    id: "shrinkr",
    name: "Shrinkr",
    tagline: "Distributed URL shortener with a read-through cache and asynchronous click analytics.",
    kind: "service",
    language: "Go",
    domains: ["cloud", "distributed", "backend"],
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
      "Docker Compose",
      "Helm",
      "React",
      "TypeScript",
    ],
    repo: "https://github.com/iratansh/Shrinkr",
    overview:
      "A URL shortener split into a Go + Gin API and a Go analytics worker, both on ECS Fargate behind an Application Load Balancer. Redirects resolve through ElastiCache Redis first and RDS PostgreSQL on a miss; every redirect publishes a click event to SQS, which the worker consumes into a clicks table. Kubernetes manifests and a Helm chart exist as scaffolding alongside the ECS deployment.",
    problem:
      "The redirect path is the hot path — it should do one cache read and return a 302. Analytics are valuable but must never slow that path down or take it out when the analytics store is unhealthy.",
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
    challenges: [
      "Keeping redirects available when Redis is degraded — cache failures are logged and the API falls back to PostgreSQL.",
      "Not losing click events between the API and the database while keeping the redirect path free of analytics writes.",
      "Locking down network paths: the worker has no inbound port, and the API only accepts traffic from the ALB security group.",
    ],
    decisions: [
      {
        title: "Read-through cache on redirect",
        body: "GET /:code reads Redis first; on a miss the API reads PostgreSQL and repopulates Redis. POST /shorten writes to PostgreSQL and then attempts to cache the mapping.",
      },
      {
        title: "Delete after durable write",
        body: "The worker long-polls SQS and deletes a message only after the click row is inserted, giving at-least-once processing of click events.",
      },
      {
        title: "Same code path locally and in AWS",
        body: "When SQS is disabled for local development, the API falls back to direct PostgreSQL click inserts, so the system runs under Docker Compose without AWS.",
      },
    ],
    metrics: [],
    metricsNote: "No published benchmarks yet — the repository documents the architecture and AWS deployment shape.",
  },
  {
    id: "aso-dashboard",
    name: "ASO Grafana Dashboard",
    tagline: "Upstream contribution: a ready-to-use Grafana dashboard for Azure Service Operator.",
    kind: "upstream",
    language: "Grafana JSON · PromQL",
    domains: ["observability", "infrastructure", "cloud"],
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
      "Azure Service Operator lets teams manage Azure resources with kubectl. It exposes Prometheus metrics, but there was no ready-made dashboard for controller health, performance, and reconciliation activity. This contribution (November 2026 onward) ships one: 28 charts across six sections, delivered as v2/config/grafana/azure-service-operator.json.",
    problem:
      "Operators running ASO had the raw metrics but had to build panels from scratch to answer basic questions: are reconciles failing, is the work queue backing up, is Azure throttling us?",
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
    challenges: [
      "Choosing thresholds that mean something: warnings turn yellow at a 5% error ratio or queue depth of 50, and red at 20%, depth 200, any Azure throttling, or one or more panics.",
      "Keeping high-cardinality views readable — most breakdowns are limited to the top 10 controllers or resource types.",
      "Filtering correctly: controller filters apply to Overview, Reconciliation, and Work queue; Azure, webhook, and process metrics are filtered by namespace.",
    ],
    decisions: [
      {
        title: "Overview first",
        body: "Six at-a-glance tiles — reconcile rate, error ratio, work-queue depth, Azure request rate, throttled requests, and reconcile panics — before any drill-down.",
      },
      {
        title: "Sections that mirror the failure modes",
        body: "Reconciliation, Work queue, Azure Resource Manager, Webhooks, and Controller process each answer one class of question, from slowest controllers by p95 to goroutine count.",
      },
      {
        title: "Sensible defaults",
        body: "Namespace defaults to azureserviceoperator-system, refresh is 30 seconds, and the default range is 3 hours.",
      },
    ],
    metrics: [
      { value: "28", label: "charts", context: "Excludes the six section headers." },
      { value: "6", label: "sections" },
      { value: "30 s", label: "refresh interval" },
      { value: "3 h", label: "default time range" },
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
      "A stream-processing stack for simulated equities data. A Java producer generates ticks for a configurable set of tickers and publishes them to Kafka. A Flink job keys the stream by ticker, computes the volume-weighted average price (VWAP) over tumbling windows, and writes results to a TimescaleDB hypertable, which Grafana charts. Kafka, TimescaleDB, and Grafana run under Docker Compose, and Terraform provisions an EC2 host to run the same stack in AWS.",
    problem:
      "VWAP is a running aggregate per symbol, so it has to be computed continuously over an unbounded stream. The work was building a pipeline where the producer, the stream processor, and the store can each be tuned on their own, and where dashboards query compact rollups instead of every raw result.",
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
    challenges: [
      "Producing at a steady target rate: a scheduled task fires every 100 ms and sends one tick's share of the per-second target (10,000 messages/s by default), with a per-second report of what was actually acknowledged.",
      "Keeping per-symbol state correct in the stream: the job keys by ticker so each window aggregates one symbol's price × volume and volume sums.",
      "Writing a continuous result stream into a relational store without one round-trip per row.",
    ],
    decisions: [
      {
        title: "Batch at both ends",
        body: "The producer uses lz4 compression, a 5 ms linger, and 64 KB batches. The Flink JDBC sink flushes every 100 rows or every second, whichever comes first, and retries up to three times.",
      },
      {
        title: "Ticker as the partition key",
        body: "Keying Kafka records by ticker keeps each symbol's ticks in order within a partition. The Flink job keys on the same field, so window state is per symbol.",
      },
      {
        title: "Let the database do the rollups",
        body: "vwap_metrics is a TimescaleDB hypertable indexed on (ticker, time). A continuous aggregate maintains one-minute buckets on a one-minute refresh policy, so dashboards can read rollups rather than raw window output.",
      },
      {
        title: "Configuration from the environment",
        body: "Brokers, topic, tickers, target rate, window length (5 s by default), and JDBC settings all come from environment variables, so the same jars run locally and on the EC2 host.",
      },
    ],
    metrics: [],
    metricsNote:
      "No published benchmarks yet. The producer's 10,000 messages/s is a configured target, not a measured throughput.",
  },
  {
    id: "nsrun",
    name: "nsrun",
    tagline: "A small container runtime in C: Linux namespaces, cgroup limits, chroot, and veth networking.",
    kind: "runtime",
    language: "C",
    domains: ["infrastructure"],
    stack: ["C", "Linux namespaces", "cgroups", "clone(2)", "chroot", "veth", "Linux bridge", "iproute2", "Make", "Docker"],
    repo: "https://github.com/iratansh/nsrun",
    overview:
      "A learning-focused container runtime that builds up what `docker run` does from first principles. nsrun clones a child process into new PID, UTS, mount, and network namespaces, sets its hostname, chroots it into a supplied root filesystem, and execs the requested command. Before the clone it creates a cgroup with memory, CPU, and PID limits. If networking is requested it also connects the container to a host bridge through a veth pair. It runs on Linux only, needs root, and is built for exploration, not production.",
    problem:
      "A container isn't a VM. It's an ordinary Linux process with a restricted view of the system. The goal was to make that concrete by writing the isolation, resource limits, and network setup directly against kernel interfaces, without a container library in between.",
    architecture: {
      caption: "The parent prepares cgroups and networking, clones the child into new namespaces, then waits and cleans up.",
      nodes: [
        { id: "cli", label: "nsrun CLI", sub: "rootfs · limits · ip", col: 0, row: 0, tone: "client" },
        { id: "cg", label: "cgroup", sub: "memory · cpu · pids", col: 1, row: 0, tone: "service" },
        { id: "net", label: "Bridge + veth", sub: "nsrun-br0", col: 1, row: 1, tone: "service" },
        { id: "clone", label: "clone()", sub: "PID · UTS · mount · net", col: 2, row: 0, tone: "service" },
        { id: "child", label: "Container process", sub: "hostname · chroot · exec", col: 3, row: 0, tone: "store" },
        { id: "rootfs", label: "rootfs", sub: "e.g. Alpine minirootfs", col: 3, row: 1, tone: "external" },
      ],
      edges: [
        { from: "cli", to: "cg", label: "create + limit" },
        { from: "cli", to: "net", label: "if --ip" },
        { from: "cg", to: "clone" },
        { from: "clone", to: "child" },
        { from: "net", to: "child", label: "veth moved in" },
        { from: "rootfs", to: "child", label: "chroot" },
      ],
    },
    challenges: [
      "Ordering setup between two processes: the cgroup and bridge must exist before the clone, while attaching the PID to the cgroup and moving the veth end into the child's network namespace can only happen after it.",
      "Cleaning up on every failure path: each setup step that fails tears down the cgroup and namespace bookkeeping created before it.",
      "Shelling out to iproute2 safely: interface names are validated (15 characters max, alphanumerics, dash, underscore) before they reach a command line.",
    ],
    decisions: [
      {
        title: "Use clone() directly",
        body: "The child runs on its own 1 MB stack, created with CLONE_NEWPID, CLONE_NEWUTS, CLONE_NEWNS, and CLONE_NEWNET, so it becomes PID 1 in its own namespace with a private hostname, mount table, and network stack.",
      },
      {
        title: "Resource limits as files",
        body: "Limits are written straight into the cgroup filesystem: memory in bytes (M and G suffixes accepted), CPU as a CFS quota over a 100 ms period (--cpu 0.5 gives 50%), and a maximum PID count.",
      },
      {
        title: "Small modules with narrow APIs",
        body: "Namespaces, containers, cgroups, and networking each have their own header and source file, and main.c just orchestrates them. A non-Linux build compiles to a stub that explains the requirements.",
      },
    ],
    metrics: [],
    metricsNote: "A work in progress built for exploration. There are no benchmarks.",
  },
  {
    id: "evaluate",
    name: "Evaluate",
    tagline: "AI mock-interview platform with LLM question generation, answer scoring, and speech.",
    kind: "application",
    language: "Java · TypeScript",
    domains: ["backend", "ai"],
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
    ],
    repo: "https://github.com/iratansh/Evaluate",
    overview:
      "A platform for practicing technical interviews in five domains: software engineering, data science, AI/ML, hardware/ECE, and robotics. A Spring Boot backend grounds each question in a domain knowledge base, generates it with a locally hosted Ollama model, and scores the candidate's answer from 0 to 10 with feedback and suggestions. Answers can be typed or spoken; Azure Speech handles speech-to-text and reads questions aloud. The Next.js frontend runs timed sessions with an animated avatar. The backend was rewritten from Python to Spring Boot in February 2026 and moved to PostgreSQL in May 2026.",
    problem:
      "An interview simulator depends on three external pieces: an LLM, a speech service, and blob storage. Any of them can be slow, missing, or unconfigured on a developer's machine. The app needed to keep running a full session regardless.",
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
    challenges: [
      "Getting structured output from a small local model: the evaluation response is parsed section by section for a score, feedback, and suggestions, with fallbacks if the format drifts.",
      "Keeping scores honest: the evaluation prompt tells the model to give 0–1 for answers that are off-topic, in the wrong domain, or incoherent.",
      "Handling browser audio: WebM and WAV recordings are normalized to WAV before speech-to-text.",
    ],
    decisions: [
      {
        title: "Lightweight retrieval over curated topics",
        body: "Each domain is a markdown file split into sections at startup. A question pulls the sections with the most keyword overlap into the prompt. Adding a domain only takes a new topics file because the service discovers domains on boot.",
      },
      {
        title: "Degrade, don't fail",
        body: "Ollama calls time out after 60 seconds and fall back to a bank of pre-written questions plus a heuristic scorer based on length and domain keywords. Speech is optional, and Blob Storage falls back to the local filesystem.",
      },
      {
        title: "One command to run, CI to keep it that way",
        body: "Docker Compose starts the backend, frontend, and Ollama together. GitHub Actions runs backend tests, API endpoint checks, ESLint, TypeScript checks, and both the development and production Docker builds.",
      },
    ],
    metrics: [],
    metricsNote: "No published benchmarks. Scoring quality depends on the local model.",
  },
  {
    id: "tempo",
    name: "Tempo",
    tagline: "Scheduled ELT for Spotify listening history: Airflow, a MinIO data lake, and a dbt star schema.",
    kind: "pipeline",
    language: "Python · SQL",
    domains: ["backend"],
    stack: ["Python", "Apache Airflow", "Spotify Web API", "MinIO", "PostgreSQL 15", "dbt", "Apache Superset", "Docker Compose"],
    repo: "https://github.com/iratansh/Tempo",
    overview:
      "A small data platform for personal listening data. Every three hours an Airflow DAG extracts recently played tracks from the Spotify Web API, writes the raw JSON to a MinIO bucket, loads it into a PostgreSQL landing table, and checks the load. dbt turns the raw JSONB into a staging view and a star schema with track, artist, and album dimensions plus a listening-event fact table, which Superset uses for dashboards. The whole stack runs under Docker Compose.",
    problem:
      "Spotify only exposes the 50 most recent plays, so history has to be collected on a schedule or it's lost. Extraction windows overlap and tasks get retried, which means the pipeline has to cope with duplicate data and partial runs without double-counting plays.",
    architecture: {
      caption: "Airflow owns extract and load; dbt owns transformation; the raw payload is kept in both the lake and the warehouse.",
      nodes: [
        { id: "spotify", label: "Spotify Web API", sub: "recently played · 50", col: 0, row: 0, tone: "external" },
        { id: "dag", label: "Airflow DAG", sub: "every 3 h · 3 retries", col: 1, row: 0, tone: "service" },
        { id: "minio", label: "MinIO", sub: "raw JSON objects", col: 2, row: 0, tone: "store" },
        { id: "raw", label: "PostgreSQL", sub: "raw_data JSONB", col: 3, row: 0, tone: "store" },
        { id: "stg", label: "dbt staging", sub: "flatten JSONB", col: 3, row: 1, tone: "service" },
        { id: "star", label: "Star schema", sub: "3 dimensions + fact", col: 2, row: 1, tone: "store" },
        { id: "superset", label: "Superset", sub: "dashboards", col: 1, row: 1, tone: "observe" },
      ],
      edges: [
        { from: "spotify", to: "dag", label: "extract" },
        { from: "dag", to: "minio", label: "put object" },
        { from: "minio", to: "raw", label: "load" },
        { from: "raw", to: "stg" },
        { from: "stg", to: "star", label: "dedupe" },
        { from: "star", to: "superset" },
      ],
    },
    challenges: [
      "Overlapping extraction windows: a play can show up in several consecutive extracts.",
      "Retries that must not duplicate data: each task retries three times with a five-minute delay.",
      "Moving data between tasks without passing whole payloads through Airflow: only the MinIO object key goes through XCom.",
    ],
    decisions: [
      {
        title: "Land raw, transform later",
        body: "Each extract is saved as one immutable JSON object in MinIO and as one JSONB row in PostgreSQL. All parsing happens in dbt, so models can be rebuilt from the original payloads.",
      },
      {
        title: "Idempotency at two layers",
        body: "The load uses ON CONFLICT on the extraction timestamp, so a retried load is skipped. In dbt, the fact table keeps one row per (played_at, track_id) using ROW_NUMBER, prefers the latest extraction, and derives a surrogate key from the same pair.",
      },
      {
        title: "Verify every load",
        body: "A final DAG task checks the landing table's row count and the latest extraction's track count. dbt schema tests enforce unique and not-null keys on the models.",
      },
    ],
    metrics: [],
    metricsNote: "A personal-scale pipeline. There are no benchmarks.",
  },
  {
    id: "voice-modulator",
    name: "Voice Modulator",
    tagline: "Real-time pitch shifting in C with a threaded audio pipeline and an FFT phase vocoder.",
    kind: "application",
    language: "C",
    domains: ["backend"],
    stack: ["C", "PortAudio", "FFTW3", "OpenMP", "POSIX threads", "GTK+ 3", "Cairo", "CoreAudio"],
    repo: "https://github.com/iratansh/Voice-Modulator",
    overview:
      "A live voice-effects application. Microphone audio is captured through PortAudio, pitch-shifted by an FFT-based phase vocoder, and played back in real time. A GTK interface with custom Cairo-drawn knobs controls the effect. Separate input, processing, and output threads are coordinated with a mutex, condition variables, and a circular buffer.",
    problem:
      "Real-time audio has a hard deadline. If a frame isn't ready when the output device needs it, you hear a glitch. Spectral pitch shifting is expensive, so capture, processing, and playback had to run concurrently, and the processing step had to finish within the time one frame takes to play.",
    architecture: {
      caption: "Three threads hand frames along a guarded pipeline; the GUI writes parameters the processing thread reads.",
      nodes: [
        { id: "mic", label: "Microphone", sub: "PortAudio input", col: 0, row: 0, tone: "client" },
        { id: "in", label: "Input thread", col: 1, row: 0, tone: "service" },
        { id: "ring", label: "Circular buffer", sub: "mutex-guarded", col: 2, row: 0, tone: "queue" },
        { id: "proc", label: "Processing thread", sub: "gate · vocoder · limiter", col: 3, row: 0, tone: "service" },
        { id: "out", label: "Output thread", sub: "PortAudio output", col: 4, row: 0, tone: "client" },
        { id: "gui", label: "GTK GUI", sub: "Cairo knobs", col: 3, row: 1, tone: "observe" },
      ],
      edges: [
        { from: "mic", to: "in" },
        { from: "in", to: "ring", label: "write" },
        { from: "ring", to: "proc", label: "input_ready" },
        { from: "proc", to: "out", label: "output_ready" },
        { from: "gui", to: "proc", label: "pitch" },
      ],
    },
    challenges: [
      "Coordinating three threads without busy-waiting: condition variables signal input-ready and output-ready between stages.",
      "Keeping the vocoder within the frame deadline: frames were reduced from 2,048 to 1,024 samples to lower latency.",
      "Silence and clipping: frames below an RMS noise floor are muted rather than processed, and output passes through a hard limiter.",
    ],
    decisions: [
      {
        title: "Phase vocoder for pitch",
        body: "1,024-sample frames with 4× overlap (a 256-sample hop) go through FFTW, and phase is tracked across frames so pitch changes without obvious phasing artifacts.",
      },
      {
        title: "Parallelism where the math is",
        body: "FFTW plans are created with one thread per core, and per-bin phase processing runs in an OpenMP parallel loop.",
      },
      {
        title: "Custom widgets",
        body: "The knobs are Cairo-drawn GTK widgets that map a rotation angle to a parameter range and display the current value.",
      },
    ],
    metrics: [],
    metricsNote:
      "No latency measurements published. Pitch shifting is implemented; the speed, echo, and reverb knobs set parameters the audio path doesn't use yet.",
  },
];

export const projectById = Object.fromEntries(projects.map((p) => [p.id, p])) as Record<string, Project>;
