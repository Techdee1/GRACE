# GRACE Phase 1 Status

## Completed Scope

- Ingest pipeline: `POST /api/v1/transactions/ingest` (async, returns `202` + `job_id`)
- Worker pipeline: Redis queue consumption, Postgres persistence, job lifecycle updates
- Graph updates: Neo4j node and edge upserts for ingested transactions
- Heuristic detection engine:
  - `pos_cash_out_ring`
  - `shell_director_web`
  - `layered_transfer_chain`
- Alerts APIs:
  - `GET /api/v1/alerts`
  - `GET /api/v1/alerts/{alert_id}`
- Entity and risk APIs:
  - `GET /api/v1/entities/{entity_id}`
  - `GET /api/v1/entities/{entity_id}/risk`
- STR APIs:
  - `POST /api/v1/str/generate`
  - `GET /api/v1/str/{str_id}`
- Immutable audit logging with payload SHA-256 hashing
- Docker Compose local environment for all services

## Data and Demo Readiness

- Synthetic dataset generated and validated:
  - 500 entities
  - 2000 transactions
  - 3 embedded laundering topologies
- End-to-end ingestion and detection verified with generated alerts.

## Open External Blocker

- STR generation is provider-blocked in current environment:
  - Groq API responds with `401 Invalid API Key`.
- Impact:
  - `POST /api/v1/str/generate` returns `503` until a valid key is provided.

## Next Immediate Step

- Provide/rotate a valid Groq API key, then re-run Task 15 STR generation and finalize sign-off.
