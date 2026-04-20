# GRACE Implementation Log

## Task 1 - Scaffold backend and AI structure

- Created foundational directory layout for backend, ai, data, infra, and docs.
- Added Python package marker files under backend app and tests.
- Added AI module placeholder READMEs for entity resolution, gnn, and str generation.
- Status: Completed

## Task 2 - Set up Docker Compose services

- Added `docker-compose.yml` at project root with services:
	- `backend` (FastAPI container)
	- `postgres` (PostgreSQL 16)
	- `redis` (Redis 7)
	- `neo4j` (Neo4j 5 Community)
- Added backend container/runtime files:
	- `backend/Dockerfile`
	- `backend/requirements.txt`
	- `backend/app/main.py` with `/health` route
- Configured service health checks and dependency ordering in compose.

### Task 2 Tests

- `docker compose config -q` passed (valid compose file).
- `docker compose up -d postgres redis neo4j` succeeded.
- `docker compose up -d backend` succeeded after dependency health.
- `curl http://localhost:8000/health` returned `{\"status\":\"ok\"}`.

- Status: Completed

## Task 3 - Define Postgres schema and models

- Added backend configuration and database core modules:
	- `backend/app/core/config.py`
	- `backend/app/core/database.py`
	- `backend/app/core/init_db.py`
- Added model enums and SQLAlchemy table definitions:
	- `backend/app/models/enums.py`
	- `backend/app/models/tables.py`
- Updated package exports in `backend/app/models/__init__.py`.

### Schema coverage added

- `entities`
- `transactions`
- `ingest_jobs`
- `alerts`
- `str_drafts`
- `audit_log`

### Decision enum coverage

- `pending`
- `approved`
- `rejected`
- `escalated`

### Task 3 Tests

- `docker compose exec backend python -m app.core.init_db` passed.
- `docker compose exec postgres psql -P pager=off -U grace -d grace -c "\\dt"` showed all 6 expected tables.
- `docker compose exec postgres psql -P pager=off -U grace -d grace -c "SELECT unnest(enum_range(NULL::decision_status));"` returned all 4 expected enum values.
- `docker compose exec backend python -m compileall app` passed.

- Status: Completed

## Task 4 - Build synthetic data generator

- Added deterministic synthetic dataset generator at [data/generate_synthetic_data.py](data/generate_synthetic_data.py).
- Output files generated under `data/synthetic/`:
	- `entities.csv`
	- `transactions.csv`
	- `pattern_manifest.json`
- Dataset design implemented:
	- 500 entities exactly:
		- 350 individuals
		- 100 businesses
		- 50 accounts
	- 2,000 transactions over 90 days
	- Realistic Nigerian data flavor:
		- Nigerian names and addresses across multiple states
		- 11-digit BVN/NIN style IDs
		- NGN-denominated transaction amounts and local channel types
- Embedded laundering scenarios:
	- POS cash-out ring
	- Shell director web
	- Layered transfer chain

### Task 4 Tests

- `python data/generate_synthetic_data.py --output-dir data/synthetic` passed.
- Generated file counts and shape checks passed (`entities.csv`, `transactions.csv`, `pattern_manifest.json`).
- Quick count verification script confirmed:
	- `entities = 500`
	- `transactions = 2000`
	- all transactions currency set to `NGN`

- Status: Completed

## Task 5 - Test synthetic data quality

- Added dataset validator at [data/validate_synthetic_data.py](data/validate_synthetic_data.py).
- Validator enforces:
	- exact entity and transaction counts
	- 90-day window constraint
	- explicit Phase 1 thresholds for all three laundering patterns

### Task 5 Tests

- `python data/validate_synthetic_data.py --input-dir data/synthetic` passed.
- Pattern summary check confirmed all embedded scenarios present:
	- `pos_cash_out_ring`
	- `shell_director_web`
	- `layered_transfer_chain`
- Additional realism spot-check confirmed geographic spread across Nigerian states.

- Status: Completed

## Task 6 - Implement async ingest API

- Added API router composition:
	- `backend/app/api/router.py`
	- `backend/app/api/routes/transactions.py`
- Added request/response schema definitions:
	- `backend/app/schemas/transactions.py`
- Added ingestion service and queue staging logic:
	- `backend/app/services/ingest_service.py`
- Added runtime dependency modules:
	- `backend/app/core/deps.py`
	- `backend/app/core/redis_client.py`
- Wired API router into FastAPI application in `backend/app/main.py`.

### Behavior implemented

- `POST /api/v1/transactions/ingest` accepts:
	- single transaction payload, or
	- batch payload with `transactions` list.
- Endpoint returns `202 Accepted` with:
	- `job_id`
	- `status`
	- `total_records`
	- `accepted_at`
- Job is persisted in Postgres `ingest_jobs` with `queued` status.
- Serialized ingest payload is stored in Redis with a 24-hour TTL.

### Task 6 Tests

- `docker compose up -d postgres redis neo4j backend` passed.
- `docker compose exec backend python -m app.core.init_db` passed.
- `curl http://localhost:8000/health` returned `{"status":"ok"}`.
- Single ingest request returned `202` with valid `job_id`.
- Batch ingest request returned `202` with valid `job_id` and `total_records=2`.
- Postgres verification showed new `ingest_jobs` rows in `queued` status.
- Redis verification showed `ingest:job:*:payload` keys with serialized payload data.

- Status: Completed

## Task 7 - Implement ingestion worker pipeline

- Added Redis queue enqueue behavior to ingest service:
	- `backend/app/services/ingest_service.py`
	- queue key: `ingest:jobs:queue`
- Added background worker module:
	- `backend/app/workers/ingest_worker.py`
- Added dedicated worker service in compose:
	- `ingest_worker` service in `docker-compose.yml`

### Behavior implemented

- Worker continuously consumes job IDs from Redis via blocking pop.
- Worker updates `ingest_jobs` lifecycle:
	- `queued` -> `processing` -> `completed` or `failed`
- Worker inserts staged transaction records into Postgres.
- Duplicate protection is applied by transaction `reference` (existing reference is skipped).
- On exceptions, job is marked `failed` with truncated error detail.

### Task 7 Tests

- `docker compose up -d --build postgres redis neo4j backend ingest_worker` passed.
- `docker compose exec backend python -m app.core.init_db` passed.
- Seeded FK-valid entity rows in `entities` table for ingest test.
- `POST /api/v1/transactions/ingest` returned `202` with queued job.
- Polling confirmed job reached `completed` with expected `processed_records`.
- Verified persisted transaction by reference (`TEST-WORKER-001`) in Postgres.
- Worker container logs confirmed successful job consumption and processing.
- `docker compose config -q` passed after compose update.
- `docker compose exec backend python -m compileall app` passed.

- Status: Completed

## Task 8 - Implement Neo4j graph upserts

- Added Neo4j driver module:
	- `backend/app/core/neo4j_client.py`
- Added graph upsert service:
	- `backend/app/services/graph_service.py`
- Updated ingestion worker to perform graph writes for every processed transaction:
	- Upsert source and destination `Entity` nodes
	- Upsert `TRANSACTS_WITH` relationship by transaction `reference`
	- Attach transaction properties on edge (`amount`, `currency`, `occurred_at`, `channel`, `transaction_id`)

### Task 8 Tests

- Restarted backend and worker services after code update.
- Ingested test transaction (`TEST-GRAPH-001`) through API.
- Verified ingest job reached `completed` status in Postgres.
- Verified transaction persisted in Postgres by reference.
- Verified Neo4j graph edge exists:
	- `(:Entity)-[:TRANSACTS_WITH {reference:'TEST-GRAPH-001'}]->(:Entity)`
	- Confirmed edge properties (`amount`, `currency`, `channel`) match ingest payload.
- Verified both involved entity nodes exist in Neo4j.
- `docker compose exec backend python -m compileall app` passed.

- Status: Completed
