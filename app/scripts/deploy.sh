#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

echo "==> Validating Compose configuration"
docker compose config >/dev/null

echo "==> Starting PostgreSQL"
docker compose up -d postgres

echo "==> Waiting for PostgreSQL health"
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' clarity-postgres 2>/dev/null || true)" = "healthy" ]; do
  i=$((i+1))
  [ "$i" -ge 60 ] && { docker compose logs --tail=200 postgres; exit 1; }
  sleep 2
done

echo "==> Starting application"
docker compose up -d --build app

echo "==> Waiting for application"
i=0
until curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 60 ]; then
    echo "Application failed health check."
    docker compose ps
    docker compose logs --tail=200 app
    docker compose logs --tail=100 postgres
    exit 1
  fi
  sleep 2
done

echo "==> Clarity is healthy"
docker compose ps
