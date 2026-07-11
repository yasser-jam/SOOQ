# Editor Performance Log

Numbers captured per roadmap step A1 / E2. Compare after each phase.

## Machine context (important)

Dev machine: **7.6 GB RAM total**, typically 1–2 GB available with desktop apps open.
This is why the editor dev-server "collapses": `next-server` alone reaches ~2.2–2.6 GB RSS
after compiling the editor route. Any additional pressure (browser loading the editor
bundle, HMR rebuilds) pushes the system into OOM; when Turbopack dies mid-write it corrupts
its filesystem cache, and the *next* start hangs for minutes rebuilding it
(`⚠ Turbopack's filesystem cache has been deleted because we previously detected an
internal error`) — which looks like "the dev server randomly hangs/crashes".

## Baseline — 2026-07-11 (before Phase A fixes, branch `editor-preview`)

| Metric | Value | How measured |
|---|---|---|
| Cold `pnpm --filter web dev` → Ready | 1.8 s (healthy cache) / **>5 min, then process died** (corrupted Turbopack cache after prior crash) | dev log timestamps |
| First compile of `/store/[slug]/design-studio/[...puckPath]` | **28.0 s compile**, 28.9 s total | next dev log (`GET … 200 in 28.8s`) |
| Warm request of same route | ~0.4 s | curl |
| `next-server` RSS after 1 editor SSR (no browser attached) | **2,210 MB** | `ps` |
| `next-server` RSS a few requests later | **2,607 MB** (still growing) | `ps` |
| Jest suite (31 suites / 149 tests) | 9.3 s | `npx jest` |

Not yet measured (needs a logged-in browser session — measure during checkpoint testing):
keystroke→canvas latency, browser-side heap, HMR round-trip after block edit.

## After Phase A fixes — 2026-07-12 (checkpoint A-1)

| Metric | Value | Note |
|---|---|---|
| First compile of editor route | **3.9 s** (compile 3.2 s) | ⚠️ warm Turbopack cache — baseline 28 s was cold; not directly comparable. Structural wins (no Buffer polyfill, no per-keystroke store rebuild) are code-level. |
| `next-server` RSS after 1 editor SSR | **1,764 MB** | vs 2,210 MB baseline at same point; heap now capped at 3 GB so it cannot balloon into system OOM. |
| Editor typing feel (subjective) | *fill in at user test* | |
| Jest suite | 31 suites / 149 tests / **all green**, ~5–9 s | Harness was dead before (ts-node missing); full upstream Puck suite recovered + new fixture suite. |
