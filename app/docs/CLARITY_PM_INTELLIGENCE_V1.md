# CLARITY PM Intelligence V1

V1 is local-first and designed for a 4 GB RAM server.

## Included
- Smart Excel/CSV import already present in CLARITY, with local header/type detection.
- Local PM Engine for delays, upcoming deadlines, milestones, risks, progress and budget.
- Local PM Assistant endpoint: `POST /api/projects/:id/assistant-local`.
- No Copilot, Ollama or external LLM is required for V1.
- PostgreSQL pool default reduced to 5 connections to limit idle RAM usage.

## Flow
1. File upload stays on the server.
2. XLSX/XLS/CSV is parsed locally with SheetJS.
3. Business mapping/validation runs locally.
4. User previews results.
5. User confirms before database insertion.
6. PM questions are answered from the current CLARITY project data.

## V1 limitation
The local assistant is deterministic. It does not pretend to be a general-purpose LLM. A future V2 can add an optional local model without changing the PM engine API.
