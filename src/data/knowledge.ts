import type { Note } from "./types";

/**
 * Knowledge base. These first entries are architecture breakdowns condensed from
 * the project READMEs. Add your own articles and notes here.
 */
export const notes: Note[] = [
  {
    id: "locks-and-network-io",
    title: "Locks should never span network I/O",
    dek: "How PaperTrade keeps a pessimistic lock on the account without holding it hostage to a price provider.",
    kind: "architecture",
    date: "2026-11",
    tags: ["transactions", "locking", "reactive"],
    projectId: "papertrade",
    source: { label: "PaperTrade README", href: "https://github.com/iratansh/PaperTrade" },
    blocks: [
      {
        type: "p",
        text: "An order touches three things that must move together: the account balance, the position, and the immutable transaction log. Two concurrent orders on one account have to serialize, so the order path takes a pessimistic FOR UPDATE lock on the account row.",
      },
      {
        type: "p",
        text: "The trap is the price. A market order needs a fresh quote, and the quote comes from an external provider. If the lock is taken first, every other order on that account waits for a network round-trip it has nothing to do with, and a slow provider turns into lock contention.",
      },
      { type: "h", text: "The ordering" },
      {
        type: "code",
        lang: "text",
        text: "1. fetch quote            (network, no locks held)\n2. BEGIN\n3. SELECT … FOR UPDATE      (account row)\n4. validate balance / holdings\n5. write balance, holdings, ledger\n6. COMMIT                   (lock released)",
      },
      {
        type: "p",
        text: "Only steps 3–6 run under the lock, and they're all local writes. Submissions are idempotent, so a client retry after a timeout can't fill the same order twice.",
      },
      {
        type: "callout",
        text: "Rule of thumb: decide what you need from the outside world first, then lock, write, and leave.",
      },
    ],
  },
  {
    id: "reject-dont-buffer",
    title: "Reject, don't buffer",
    dek: "Admission control in the Telemetry Collector, and why an honest RESOURCE_EXHAUSTED beats an invisible queue.",
    kind: "architecture",
    date: "2026-11",
    tags: ["backpressure", "gRPC", "queues"],
    projectId: "telemetry-collector",
    source: { label: "Telemetry Collector README", href: "https://github.com/iratansh/Telemetry-Collector" },
    blocks: [
      {
        type: "p",
        text: "Every queue is a bet that load will drop before memory runs out. An unbounded buffer hides overload: latency climbs, memory climbs, and the first visible symptom is often the OOM kill that loses everything in the buffer at once.",
      },
      {
        type: "p",
        text: "The collector caps three things: the jobs channel (queue capacity 128 by default), the export worker pool (4 workers), and pending bytes. When any limit is hit, the OTLP/gRPC receiver returns RESOURCE_EXHAUSTED and the sender decides what to do: retry with backoff, shed, or alert.",
      },
      { type: "h", text: "What it looked like under a burst" },
      {
        type: "list",
        items: [
          "Paced at 2,000 events/s for 60 s: 120,000 accepted, zero rejected, max queue depth of 1 request.",
          "Unpaced 50,000-event burst: 16,000 accepted, 340 requests rejected with RESOURCE_EXHAUSTED, no other RPC errors.",
        ],
      },
      {
        type: "p",
        text: "The burst number is a saturation observation, not a capacity figure. The point is that overload stayed bounded and visible to the sender instead of turning into unbounded memory growth.",
      },
      {
        type: "callout",
        text: "Try it: the Backpressure Simulator in the Technical Lab models both policies side by side.",
      },
    ],
  },
  {
    id: "wal-recovery",
    title: "Measuring what a restart actually costs",
    dek: "Benchmarking WAL recovery honestly: separate the scan from the replay, and say what's excluded.",
    kind: "architecture",
    date: "2026-11",
    tags: ["write-ahead log", "durability", "benchmarks"],
    projectId: "telemetry-collector",
    source: { label: "Telemetry Collector README", href: "https://github.com/iratansh/Telemetry-Collector" },
    blocks: [
      {
        type: "p",
        text: "At-least-once delivery is a claim about crashes, so the benchmark has to crash. The recovery tool seeds a temporary WAL from a child process that syncs its records and exits without closing the WAL. The parent reopens it and times two things separately.",
      },
      {
        type: "list",
        items: [
          "Scan: open the WAL, validate frames, decode Protobuf, build the pending replay list: 21.4 ms for 10,000 records.",
          "Replay: push every pending record through the real worker pool and write durable checkpoints: 1.64 s, about 6,084 events/s.",
        ],
      },
      {
        type: "p",
        text: "Replay uses an immediate-success exporter, so it measures the collector's queue, workers, and WAL acknowledgements, not network or backend latency. Each seeded request carries exactly one event, so 10,000 events means 10,000 WAL records and 10,000 requests.",
      },
      {
        type: "callout",
        text: "A benchmark is only as useful as its footnotes. Record what was excluded alongside the number.",
      },
    ],
  },
  {
    id: "hot-path-analytics",
    title: "Keeping analytics off the hot path",
    dek: "Shrinkr's redirect path does one cache read and a 302; everything else is somebody else's problem.",
    kind: "architecture",
    date: "2026-11",
    tags: ["caching", "SQS", "AWS"],
    projectId: "shrinkr",
    source: { label: "Shrinkr README", href: "https://github.com/iratansh/Shrinkr" },
    blocks: [
      {
        type: "p",
        text: "A URL shortener has one job that matters at request time: turn a code into a Location header. Shrinkr's API reads Redis first, falls back to PostgreSQL on a miss, repopulates the cache, and returns a 302.",
      },
      {
        type: "p",
        text: "Click analytics are published to SQS asynchronously during the redirect. A separate Go worker long-polls the queue, inserts click rows into PostgreSQL, and deletes each message only after the write succeeds.",
      },
      { type: "h", text: "Failure behaviour" },
      {
        type: "list",
        items: [
          "Redis down → errors are logged, redirects resolve from PostgreSQL.",
          "Worker or database slow → clicks wait in SQS; redirects are unaffected.",
          "Worker crashes mid-message → the message isn't deleted, so it's redelivered (at-least-once).",
        ],
      },
    ],
  },
];

export const noteById = Object.fromEntries(notes.map((n) => [n.id, n])) as Record<string, Note>;
