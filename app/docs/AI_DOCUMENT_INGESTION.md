# CLARITY PM — Ingestion documentaire IA

## Objectif

Permettre à un chef de projet/PMO de charger des fichiers métier et de faire traiter leur contenu par le moteur IA configuré dans **Administration → AI Provider Hub**.

Formats acceptés :

- XLSX / XLS / CSV
- PDF
- DOCX
- TXT / MD
- JSON

## Pipeline

```text
Fichier utilisateur
      ↓
Multer (10 Mo / fichier, 10 fichiers)
      ↓
Extraction serveur
  ├─ Excel/CSV → feuilles + lignes + cellules
  ├─ PDF      → texte
  ├─ DOCX     → texte
  └─ TXT/MD/JSON → texte
      ↓
Contexte projet CLARITY
      ↓
AI Provider Hub
  ├─ Gemini
  ├─ Groq
  ├─ Mistral
  └─ OpenRouter :free
      ↓
Analyse sémantique + comparaison
      ↓
JSON structuré
  ├─ tâches
  ├─ jalons
  ├─ risques
  ├─ dates
  ├─ budgets
  ├─ décisions
  └─ corrections
      ↓
Propositions CRUD
      ↓
Confirmation utilisateur
      ↓
Application CLARITY
```

## API

### `POST /api/projects/:id/ai/intake`

Multipart/form-data :

- `files`: 1 à 10 fichiers
- `message`: consigne IA optionnelle

La route ne modifie jamais le projet pendant l'analyse. Elle crée des propositions persistées dans la mémoire Copilot du projet.

### `POST /api/projects/:id/copilot/apply`

Application explicite des propositions après confirmation :

```json
{
  "confirmed": true,
  "proposalIds": ["pm-..."]
}
```

## Sécurité

- authentification CLARITY obligatoire ;
- contrôle du rôle métier ;
- contrôle d'accès au projet ;
- formats de fichiers limités ;
- taille cumulée limitée à 50 Mo ;
- aucune clé IA envoyée au navigateur après configuration ;
- aucune modification automatique ;
- chaque action IA est vérifiée contre le projet cible avant écriture ;
- audit des modifications lors de l'application.

## Administration

Le panneau d'administration expose maintenant un état réel des intégrations :

- Microsoft Entra ID
- PostgreSQL
- AI Provider Gateway
- Copilot Studio
- ingestion documentaire IA

Les providers IA peuvent être activés/désactivés depuis le **AI Provider Hub** et testés individuellement.
