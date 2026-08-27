# Clarity deployment fix

This version fixes the deployment failure caused by a persistent PostgreSQL volume
having a different password for `clarity_admin` than the application expected.

## Important

Do NOT run `docker compose down -v` on an existing installation.

The persistent PostgreSQL volume is intentionally preserved.

## Required deployment secrets

The CI/CD system must provide `POSTGRES_PASSWORD` (and, if the postgres superuser
password differs, `POSTGRES_SUPERPASSWORD`). These are infrastructure bootstrap
secrets, not the application's Entra/AI/User configuration.

Application integrations remain configurable from the web administration area.

## Deploy

```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

## Diagnostics

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=200 postgres
```

The health endpoint must return HTTP 200:

```bash
curl -fsS http://127.0.0.1/api/health
```
