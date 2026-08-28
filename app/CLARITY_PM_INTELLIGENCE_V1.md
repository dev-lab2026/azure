# CLARITY PM Intelligence V1

## Intégration réelle

- Import intelligent XLSX/XLS/CSV : analyse des feuilles, détection des types, normalisation, récupération conservatrice des blocs métier et aperçu avant écriture.
- Le preview ne modifie jamais PostgreSQL.
- Les projets, tâches et jalons passent par la validation existante avant confirmation.
- Le Copilot principal utilise maintenant une chaîne de secours :
  1. Microsoft Copilot Studio si `COPILOT_DIRECTLINE_TOKEN_ENDPOINT` est configuré ;
  2. AI Gateway si un provider est configuré ;
  3. Clarity Local PM Engine si aucun service IA n'est disponible.
- Les modifications du Copilot restent des propositions et nécessitent une confirmation explicite.

## Variables Copilot Studio

Configurer dans `.env` :

- `COPILOT_AGENT_ID`
- `COPILOT_ENVIRONMENT_ID`
- `COPILOT_TENANT_ID`
- `COPILOT_DIRECTLINE_TOKEN_ENDPOINT`

Le token Direct Line reste côté serveur.

## Déploiement

```bash
docker compose build --no-cache app
docker compose up -d app
```

Puis vérifier :

```bash
docker compose logs -f app
```
