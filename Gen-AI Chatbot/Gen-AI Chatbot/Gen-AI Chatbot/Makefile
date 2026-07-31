.PHONY: up down build rebuild ingest eval clean logs ps shell-backend shell-frontend

# Bring up the whole stack (frontend, backend, qdrant, redis, langfuse)
up:
	docker compose up --build

# Bring up in detached mode
up-d:
	docker compose up --build -d

# Stop and remove containers (keeps volumes)
down:
	docker compose down

# Rebuild images without cache
rebuild:
	docker compose build --no-cache

# Run one-shot ingestion (Excel -> DuckDB, PDFs -> Qdrant). Requires stack already up.
ingest:
	docker compose exec backend python -m app.data.duckdb_loader
	docker compose exec backend python -m app.data.pdf_ingestion

# Run the golden-set eval harness
eval:
	docker compose exec backend pytest eval/run_goldens.py -v

# Nuke everything including volumes (DuckDB data, Qdrant index, Redis sessions, Langfuse db)
clean:
	docker compose down -v

# Tail logs from all services
logs:
	docker compose logs -f

# Container status
ps:
	docker compose ps

shell-backend:
	docker compose exec backend bash

shell-frontend:
	docker compose exec frontend sh
