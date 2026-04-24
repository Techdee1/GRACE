# GRACE Agent Implementation Log

## Task 01 — Scope Lock and Working Rules
Date: 2026-04-24
Status: Completed

### Decisions Confirmed
- Branch strategy: use a dedicated branch.
- Commit format: feat(agent): task-name.
- Documentation file: docs/AGENT_IMPLEMENTATION_LOG.md.
- Primary model: openai/gpt-4o.
- Groq mode: fallback only.
- Commit isolation: agent/ and selected docs only.
- Auth handling: proceed until lua auth is required.

### Validation
- Clarifications captured before implementation start.

---

## Task 02 — Agent Scaffold Setup
Date: 2026-04-24
Status: Completed

### Work Completed
- Created branch feat/agent-lua-v2.
- Created agent/ workspace.
- Installed lua-cli globally.
- Confirmed lua init auth boundary requires LUA_API_KEY.
- Manually scaffolded agent project to continue implementation:
  - npm project initialization
  - dependencies: zod, groq-sdk, csv-parse
  - dev dependencies: typescript, @types/node, tsx
  - TypeScript config created and fixed for Node16 mode
  - folder structure created under src/, tests/
  - created agent/.env.example
  - created agent/README.md
  - created agent/src/index.ts

### Issues Encountered
- lua init blocked by authentication (expected):
  - No API key found. Requires lua auth configure or LUA_API_KEY env.
- Initial TypeScript check failed due deprecated moduleResolution setting from generated tsconfig.

### Fixes Applied
- Updated tsconfig to:
  - module: Node16
  - moduleResolution: Node16
  - types: [node]
- Added minimal source file agent/src/index.ts.

### Test Evidence
- Command: npx tsc --noEmit
- Result: PASS (no errors)

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Ready to start Task 03 (ParseTransactionsTool) once continuing on this branch.

---

## Task 03 — ParseTransactions Tool
Date: 2026-04-24
Status: Completed

### Work Completed
- Implemented `ParseTransactionsTool` in `agent/src/tools/ParseTransactionsTool.ts`.
- Added shared tool result envelope type in `agent/src/types/tooling.ts`.
- Added parsing support for both CSV and JSON transaction payloads.
- Added field normalization for common source formats:
  - id/reference mapping (`id`, `reference`, `tx_id`, `transaction_id`)
  - sender/receiver id mapping from multiple input key variants
  - amount parsing from numeric and string fields
  - timestamp normalization to ISO-8601
  - channel normalization with controlled enum and `unknown` fallback
- Added privacy guard for BVN-like identifiers by masking to `***last4`.
- Added per-row validation and skip handling with summarized skip reasons.
- Added output summary metrics:
  - parsed/skipped counts
  - unique sender/receiver counts
  - total volume
  - date range (earliest/latest)

### Issues Encountered
- TypeScript `rootDir` excluded test files, causing typecheck failure.
- Node16 module resolution required explicit `.js` extensions in TS import paths.
- `LuaTool` interface typing from `lua-cli` conflicted with local `zod` type identity.

### Fixes Applied
- Updated `agent/tsconfig.json` `rootDir` from `src` to `.`.
- Added explicit `.js` import extensions for local module imports.
- Removed direct `implements LuaTool` constraint to avoid cross-package Zod type conflict while preserving Lua-compatible tool shape.
- Tightened test null checks for strict TypeScript settings.

### Test Evidence
- Command: `npm run typecheck`
- Result: PASS
- Command: `npm run test:parse`
- Result: PASS

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Task 03 is complete and ready for focused commit.

---

## Task 04 — BuildEntityGraph Tool
Date: 2026-04-24
Status: Completed

### Work Completed
- Implemented `BuildEntityGraphTool` in `agent/src/tools/BuildEntityGraphTool.ts`.
- Added graph construction over normalized transactions:
  - adjacency map per entity
  - directed edge aggregation with tx count, amount sum, first/last timestamps, and channels
  - node metrics including in-degree, out-degree, tx count, flow totals, and unique counterparties
- Added hub detection:
  - high outbound hubs by out-degree and total outbound volume
  - high inbound hubs by in-degree and total inbound volume
- Added shared-identifier cluster detection using masked identifiers (`***last4`) with configurable minimum cluster size.
- Added deterministic sorting for nodes, edges, adjacency, and cluster outputs for stable tests/demo reproducibility.
- Added focused tool test in `agent/tests/buildEntityGraphTool.test.ts`.
- Added npm script `test:graph` in `agent/package.json`.

### Issues Encountered
- No blocking implementation issues after Task 03 TypeScript/module fixes.

### Fixes Applied
- Reused strict import extension pattern (`.js`) and shared tool envelope conventions established in prior tasks.

### Test Evidence
- Command: `npm run typecheck`
- Result: PASS
- Command: `npm run test:parse`
- Result: PASS (regression)
- Command: `npm run test:graph`
- Result: PASS

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Task 04 is complete and ready for focused commit.

---

## Task 05 — DetectPatterns Tool
Date: 2026-04-24
Status: Completed

### Work Completed
- Implemented `DetectPatternsTool` in `agent/src/tools/DetectPatternsTool.ts`.
- Added heuristic prefilter detection (no LLM reasoning) with configurable sensitivity profiles (`low`, `medium`, `high`).
- Implemented deterministic candidate generation with evidence snippets and metrics for:
  - `shared_identifier_cluster`
  - `structuring_near_threshold`
  - `rapid_in_out_flow`
  - `hub_conduit_activity`
- Added sensitivity-aware thresholds for:
  - shared identifier cluster size
  - near-threshold structuring transaction count
  - rapid-flow time window and outflow ratio
  - hub in/out degree criteria
- Added deterministic sorting and candidate cap (`max_candidates`) for repeatable demo output.
- Added focused tool test in `agent/tests/detectPatternsTool.test.ts`.
- Added npm script `test:patterns` in `agent/package.json`.

### Issues Encountered
- No blocking implementation issues.

### Fixes Applied
- Reused existing strict TypeScript and tool-envelope conventions from prior tasks to keep output contract consistent.

### Test Evidence
- Command: `npm run typecheck`
- Result: PASS
- Command: `npm run test:parse`
- Result: PASS (regression)
- Command: `npm run test:graph`
- Result: PASS (regression)
- Command: `npm run test:patterns`
- Result: PASS

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Task 05 is complete and ready for focused commit.

---

## Task 06 — ReasonAboutCluster Tool
Date: 2026-04-24
Status: Completed

### Work Completed
- Implemented `ReasonAboutClusterTool` in `agent/src/tools/ReasonAboutClusterTool.ts`.
- Added strict reasoning output contract with schema-validated fields:
  - `assessment`
  - `confidence`
  - `red_flags`
  - `alternatives_considered`
  - `recommendation`
  - `rationale_summary`
- Implemented execution modes:
  - `deterministic` (default, test-safe)
  - `live` (OpenAI primary path, Groq fallback path)
- Added parser recovery logic for model responses:
  - direct JSON parse
  - fenced JSON block extraction
  - first-object slicing recovery
- Added graceful degradation policy:
  - if primary/fallback model fails or returns invalid JSON, degrade to deterministic reasoning output.
- Added focused tool test in `agent/tests/reasonAboutClusterTool.test.ts`.
- Added npm script `test:reason` in `agent/package.json`.

### Issues Encountered
- Initial TypeScript failures from Zod v4 signature requirements and defaulted-input typing.

### Fixes Applied
- Updated record schema usage to explicit key/value signature for Zod v4.
- Updated execute input type to `z.input<typeof inputSchema>` so defaultable fields are optional at call sites.
- Refactored context handling to optional schema with internal defaults for prompt construction.

### Test Evidence
- Command: `npm run typecheck`
- Result: PASS
- Command: `npm run test:parse`
- Result: PASS (regression)
- Command: `npm run test:graph`
- Result: PASS (regression)
- Command: `npm run test:patterns`
- Result: PASS (regression)
- Command: `npm run test:reason`
- Result: PASS

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Task 06 is complete and ready for focused commit.

---

## Task 07 — ScoreAndExplainRisk Tool
Date: 2026-04-24
Status: Completed

### Work Completed
- Implemented `ScoreAndExplainRiskTool` in `agent/src/tools/ScoreAndExplainRiskTool.ts`.
- Added direct risk scoring from reasoning outputs using:
  - recommendation-weighted base scoring
  - confidence scaling
  - red-flag boost
- Added one-hop risk propagation over adjacency with configurable decay (`decay_factor`).
- Added source attribution per entity risk:
  - `direct`
  - `indirect`
  - `direct_and_indirect`
- Added explainable risk outputs with supporting candidates and summary counts.
- Added focused test in `agent/tests/scoreAndExplainRiskTool.test.ts`.
- Added npm script `test:risk` in `agent/package.json`.

### Issues Encountered
- Initial score calibration placed a high-confidence `ESCALATE` fixture at `MEDIUM` risk in tests.

### Fixes Applied
- Tuned recommendation base weights so high-confidence escalation cases map correctly to `HIGH` risk while preserving propagation behavior.

### Test Evidence
- Command: `npm run typecheck`
- Result: PASS
- Command: `npm run test:risk`
- Result: PASS
- Command: `npm run test:parse`
- Result: PASS (regression)
- Command: `npm run test:graph`
- Result: PASS (regression)
- Command: `npm run test:patterns`
- Result: PASS (regression)
- Command: `npm run test:reason`
- Result: PASS (regression)

### Notes
- No backend/ or grace-frontend/ files were modified for this task.
- Task 07 is complete and ready for focused commit.
