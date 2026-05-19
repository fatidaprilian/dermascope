# DermaScope Documentation Index

Use this file as the compact routing map for project documentation. Read only the documents that match the current task.

| Document | Purpose | Read When | Status | Last Updated |
| --- | --- | --- | --- | --- |
| `project-brief.md` | Product scope, requirements, constraints, and out-of-scope items. | Planning product work, UI work, or scope checks. | Active | 2026-05-19 |
| `architecture-decision-record.md` | Runtime, topology, and major technical decisions. | Changing architecture, deployment, API boundaries, or runtime assumptions. | Active | 2026-05-19 |
| `flow-overview.md` | User and system flow for upload, camera capture, analysis, result display, and errors. | Changing user journeys or request/response behavior. | Active | 2026-05-19 |
| `api-contract.md` | HTTP API, UI operation contract, response metadata, errors, and retry behavior. | Changing `/api/*`, operation IDs, analysis metadata, or frontend API calls. | Active | 2026-05-19 |
| `database-schema.md` | Data model and persistence decision. | Changing storage, retention, or browser/session data handling. | Active | 2026-05-19 |
| `DESIGN.md` | Human-readable design contract and research dossier. | UI, UX, layout, visual system, motion, or responsive work. | Active | 2026-05-19 |
| `design-intent.json` | Machine-readable design guardrails, tokens, research, and review rubric. | UI implementation, UI review, or design drift checks. | Active | 2026-05-19 |
| `docker-runtime.md` | Docker runtime and deployment notes. | Changing container, Compose, Nginx, or production runtime assets. | Active | 2026-05-13 |

## Routing Notes

- Start with `README.md` for public setup and development commands.
- Use `project-brief.md`, `flow-overview.md`, and `DESIGN.md` for frontend work.
- Use `api-contract.md`, `architecture-decision-record.md`, and `database-schema.md` for backend/API work.
- Use `docker-runtime.md` only for Docker or production container changes.
