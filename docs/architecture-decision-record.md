# Architecture Decision Record

## ADR-002: Focused Facial Skin Signal Mapping Product

Status: Accepted

Date: 2026-05-19

## Context

DermaScope is a production-facing facial skin signal mapping app. A user uploads or captures one face photo, the backend analyzes visible image-processing signals, and the frontend returns an overlay, category scores, a total Skin Health Score, and a zone-by-zone breakdown.

The repository folder may still be named `imglab`, but the active product, public UI, and API contract are DermaScope.

## Decision

Use a focused fullstack monolith shape:

- Frontend runtime: React + Vite with Tailwind CSS and DaisyUI.
- Backend runtime: FastAPI with OpenCV-Python.
- Active UI: `frontend/index.html`, `frontend/src/App.jsx`, and `frontend/src/index.css`.
- Active operation contract: `frontend/src/utils/operations.js`.
- Active processing engine: `backend/imglab_api/processing.py`.
- Active transport: `backend/imglab_api/main.py`.
- Development lane: split frontend and backend services through `compose.yaml`.
- Production lane: one FastAPI service serving both `/api/*` and built React assets through `compose.prod.yaml` and `docker/monolith.Dockerfile`.

Expose one user-facing goal: `skin-health-analysis`. Map it to one internal operation: `facial-skin-analysis`.

## Rationale

This architecture matches the current product evidence:

- The app needs one clear upload/camera-to-analysis flow.
- OpenCV-Python is a better fit than browser-only processing for face detection, skin masks, condition masks, and overlay generation.
- A database is unnecessary because the product does not store accounts, image history, overlays, or analysis records.
- A single backend deploy remains simpler than splitting services for the current scope.
- Keeping the frontend registry focused prevents the old general image-processing workbench from drifting back into the public contract.

## Data Decision

Do not add a database for the current scope. Store selected images, object URLs, overlays, and metadata only in browser memory for the current session. Process uploads in backend memory and return the overlay immediately.

## API Decision

Expose:

- `GET /api/health`
- `GET /api/goals`
- `POST /api/process`

`POST /api/process` accepts one multipart file, `goal_id=skin-health-analysis`, and optional `parameters={}`. It returns an `image/png` body plus `X-DermaScope-*` headers. See `docs/api-contract.md`.

## Security and Privacy Decision

Do not add authentication for the current scope. There are no accounts, shared assets, stored records, or privileged resources.

Protect the boundary by:

- validating upload content type and size;
- decoding images in memory;
- returning safe `{ code, message }` errors;
- avoiding raw upload logs;
- avoiding stored image history.

## Rejected Alternatives

### Keep the General ImgLab Workbench

Rejected. The user-facing product is now DermaScope. Keeping a parallel general workbench creates stale UI, stale docs, and a larger unsupported contract.

### Browser-Only OpenCV Processing

Rejected for the active scope. DermaScope needs server-side OpenCV processing for face detection, skin mask generation, condition masks, overlay rendering, and consistent API behavior.

### Multi-Service Architecture

Rejected for the current scope. There is no evidence for independent scaling, separate teams, hard fault isolation, or different deploy cadence.

### Database-Backed History

Rejected for privacy and scope. The product promise is one-photo, per-session analysis without stored image history.

## Evidence

- React official docs: https://react.dev/learn/creating-a-react-app, fetched 2026-05-19.
- Vite official docs: https://vite.dev/guide/, fetched 2026-05-19.
- Tailwind CSS Vite installation docs: https://tailwindcss.com/docs/installation/using-vite, fetched 2026-05-19.
- DaisyUI install docs: https://daisyui.com/docs/install/, fetched 2026-05-19.
- FastAPI `UploadFile` docs: https://fastapi.tiangolo.com/reference/uploadfile/, fetched 2026-05-07.
- OpenCV image codec docs: https://docs.opencv.org/4.x/d4/da8/group__imgcodecs.html, fetched 2026-05-07.

## Consequences

Positive:

- The active contract is small and testable.
- The UI can stay focused on one production workflow.
- Privacy risk stays lower because images are not persisted.
- The backend can tune image-processing heuristics without changing the frontend contract.

Tradeoffs:

- Backend availability is required for analysis.
- Heuristic quality must be tuned with real face photos across lighting and skin tones.
- If saved history or model-backed analysis is added later, the architecture and privacy docs must be revisited.

## Next Validation Action

Run automated validation, then manually test upload, camera capture, service-offline state, successful analysis, fallback warning, reset, and mobile recomposition with real face photos.
