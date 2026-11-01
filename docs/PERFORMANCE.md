# Performance audit

Audited on 2026-11-02 on `claude/perf`. This is a static, vanilla JavaScript
Canvas game built by concatenation, with native Capacitor packaging. There is
no application server, database, React tree, AI service or runtime dependency
bundle. Preserve the shared script scope and identical platform behavior.

| # | Item | Status | Reason |
|---|---|---|---|
| 1 | Skeleton loaders | Already in place | Boot loader and procedural render fallbacks cover media arrival; see build.cjs and js/media.js. |
| 2 | WebP/AVIF images | Already in place | WebP masters/derived low-resolution tiers are integrated; see tools/lowres.cjs. |
| 3 | Dedupe API calls | Already in place | Media pending maps, prefetch seen sets and comic manifest shared loading promise suppress duplicate work. |
| 4 | Debounce search | Not applicable | No remote search input in the game. |
| 5 | Paginate API results | Not applicable | No collection API; comic manifests are bounded and local. |
| 6 | CDN static files | Recommended (infra) | Retain static edge delivery; measure cache hits and regional latency before changing providers. |
| 7 | Background jobs | Already in place | Asset derivation runs in offline tools; runtime prefetch yields to gameplay. |
| 8 | N+1 queries | Not applicable | No database queries. |
| 9 | Brotli/gzip | Recommended (infra) | Verify Content-Encoding on deployed HTML; enable host compression if absent, without recompressing media. |
| 10 | Free caching | Already in place | In-memory media/room caches and bounded, build-scoped Cache Storage in sw.js. |
| 11 | Remove unused dependencies | Not applicable | Packages support native integration, media tools and tests; no runtime bundle to trim or verified unused package removed. |
| 12 | Request timeouts | Applied | Pack JSON headers/body now abort after 15 seconds and release queued Start via the existing error path; comic refresh already has 8 seconds. |
| 13 | Stream AI responses | Not applicable | No AI response generation. |
| 14 | Optimistic UI | Not applicable | Gameplay/save state is local; no server mutation round trips. |
| 15 | Lazy-load images | Already in place | Canvas media map loads on demand, with bounded room-graph prefetch rather than DOM image loading. |
| 16 | Parallel requests | Already in place | Prefetch uses bounded concurrency; audio is staged to protect priority requests. |
| 17 | DB indexes | Not applicable | No database or migrations needed. |
| 18 | Trace slow requests | Not applicable | No server requests to trace; tests/boot.cjs measures browser asset requests. |
| 19 | Server near DB | Recommended (infra) | If a backend is introduced, colocate it with its database; currently neither exists. |
| 20 | SSR/static rendering | Already in place | build.cjs emits static HTML for both games and editor variants. |
| 21 | Defer third-party scripts | Not applicable | Game has no third-party remote script dependency. |
| 22 | Route code splitting | Not applicable | No routed framework; editor is already excluded from game pages; splitting shared global scope would be a risky rewrite. |
| 23 | Virtualize long lists | Not applicable | No unbounded DOM result list; comic chapter/slide counts are validated and bounded. |
| 24 | Select needed columns | Not applicable | No SQL/API column selection. |
| 25 | Connection pooling | Not applicable | No database connections. |
| 26 | Avoid re-renders | Already in place | Canvas engine uses cached room baking, scratch surfaces and adaptive quality; see js/perf.js and tests/roomcache.cjs. |
| 27 | Browser cache headers | Recommended (infra) | Verify deployed Cache-Control; revalidate HTML/JSON and use long lifetimes only for versioned assets. |
| 28 | Load balancing | Recommended (infra) | Static hosting handles distribution; only consider backend balancing if a measured backend bottleneck appears. |
| 29 | Self-host/limit fonts | Already in place | System font stacks avoid remote font downloads and weight payloads. |
| 30 | Free web-vitals RUM | Not applicable | No telemetry consumer exists; Canvas frame-time adaptation already measures the relevant runtime cost without a new dependency or persistent console logging. |
| 31 | Slow devices/networks | Already in place | tests/preload.cjs covers Save-Data/2g/3g policy, tests/speed2.cjs covers low frame rates; physical and throttled browser runs remain release verification work. |

## What's left

- Verify deployed CDN, compression and HTTP caching headers with the hosting
  operator. No hosting/deploy configuration was changed in this audit.
- Run the full browser suite and throttled cold/returning boots on a machine
  allowing a loopback HTTP server with Chromium installed. Measure CPU/frame
  time and network contention on an actual low-end phone before tuning quality.
- Consider opt-in free web-vitals console reporting only if someone will use
  those page-level metrics; they do not replace Canvas frame-time measurements.
- Retain current dependencies and media formats unless profiling demonstrates
  a concrete benefit from removal or conversion. No database changes, paid
  services, environment files, remotes or deployment changes were made.

## Validation and completion checklist

- [x] Audit all 31 items and preserve existing delivery architecture.
- [x] Add bounded pack download with an isolated regression check for stalled
  response headers and body; both verify queued Start release and timer cleanup.
- [x] Build and native package assembly succeed before/after the change.
- [x] JavaScript syntax checks and non-browser test harnesses run (see local report).
- [ ] Full browser suite: baseline and final attempts stop because this sandbox
  denies listening on 127.0.0.1:8220 (`EPERM`); expected Chromium at
  `/opt/pw-browsers/chromium` is also absent.

No TypeScript or lint script/configured lint gate exists in package.json; do not
install a compiler/linter or invent a framework-specific check for this project.

Final local evidence: `npm run build`, `npm run app:pack`, syntax checks of 73
JavaScript/build/test files, `git diff --check`, and the new pack timeout test
pass. Twenty-one additional isolated harnesses pass. Three harnesses marked
`noBrowser` (hero-delivery, hero-frame-alpha, hero-alpha) actually launch Chromium
and fail because its executable is absent. Both full-suite attempts fail at
server startup before browser verification. Local commits were attempted but
`.git/index.lock` creation is denied by the read-only filesystem; changes remain
uncommitted. No push was attempted.
