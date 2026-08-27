#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-clarity_pm_enterprise}"
DB_USER="${DB_USER:-clarity_admin}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}"

if [ -z "$DB_PASSWORD" ]; then
  echo "ERROR: DB_PASSWORD/POSTGRES_PASSWORD is required for PostgreSQL bootstrap."
  exit 1
fi

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
i=0
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "${POSTGRES_SUPERUSER:-postgres}" >/dev/null 2>&1; do
  i=$((i+1))
  [ "$i" -ge 60 ] && { echo "ERROR: PostgreSQL did not become ready."; exit 1; }
  sleep 2
done

SUPERUSER="${POSTGRES_SUPERUSER:-postgres}"
SUPERPASS="${POSTGRES_SUPERPASSWORD:-${POSTGRES_PASSWORD:-}}"

if [ -z "$SUPERPASS" ]; then
  echo "ERROR: POSTGRES_SUPERPASSWORD/POSTGRES_PASSWORD is required."
  exit 1
fi

export PGPASSWORD="$SUPERPASS"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres \
  -v ON_ERROR_STOP=1 \
  -v app_user="$DB_USER" \
  -v app_password="$DB_PASSWORD" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  ELSE
    EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', :'app_user', :'app_password');
  END IF;
END
$$;
SQL

psql -h "$DB_HOST" -p "$DB_PORT" -U "$SUPERUSER" -d postgres \
  -v ON_ERROR_STOP=1 \
  -v app_user="$DB_USER" \
  -v db_name="$DB_NAME" <<'SQL'
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'app_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name') \gexec
SQL

echo "PostgreSQL bootstrap completed."
