# DermaScope

DermaScope is a browser-first facial skin analysis app. A user uploads one face photo, the system analyzes visible skin conditions with digital image processing, and the app returns an annotated overlay, category scores, a total Skin Health Score, and a zone-by-zone breakdown.

The repository folder may still be named `imglab` during the transition. The product direction is now DermaScope, because the scope has moved from a general image processing workbench to a focused face-skin analysis flow.

## Who It Is For

DermaScope is for students, instructors, and image-processing learners who need an explainable facial skin analysis demo without special hardware, accounts, or stored photos. It is not a medical diagnosis tool.

## Current Capabilities

- Upload one PNG, JPEG, or WebP face photo up to 10 MB.
- Detect a face region with OpenCV-Python and fall back to a centered face region when no face is found.
- Split the face into forehead, left cheek, right cheek, nose, and chin zones.
- Estimate acne, dark spots, wrinkles, redness, and enlarged pores with classical image-processing heuristics.
- Return an overlay PNG that highlights problem areas by condition.
- Show per-category scores, an overall Skin Health Score, and per-zone breakdowns.
- Keep images out of persistent storage.

## Project Structure

- `frontend/`: React + Vite frontend.
- `frontend/src/App.jsx`: upload, analysis result, overlay, scores, and zone UI.
- `frontend/src/utils/operations.js`: skin analysis public operation contract.
- `backend/`: optional FastAPI backend for OpenCV-Python analysis.
- `backend/imglab_api/processing.py`: facial skin analysis and overlay generation.
- `docs/`: product, architecture, flow, API, data, and design contracts.

## Local Development

Install frontend dependencies once:

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

From the repository root, the same frontend command is available:

```bash
npm run dev
```

Run the backend:

```bash
npm run backend
```

Run validation checks:

```bash
npm run build
npm test
npm run check:backend
```

## API

The frontend calls:

- `GET /api/health`
- `GET /api/goals`
- `POST /api/process`

`POST /api/process` accepts one image file and returns an overlay PNG. Analysis metadata is returned in the `X-DermaScope-Analysis` response header as JSON.

## Documentation

- `docs/project-brief.md`: product scope and requirements.
- `docs/architecture-decision-record.md`: runtime and architecture decisions.
- `docs/flow-overview.md`: upload, analysis, scoring, overlay, and error flows.
- `docs/api-contract.md`: public UI and HTTP API contracts.
- `docs/database-schema.md`: in-memory data model and persistence decision.
- `docs/DESIGN.md`: human-readable design contract.
- `docs/design-intent.json`: machine-readable design intent.

## Validation

Before release, validate:

1. Frontend build and lint pass.
2. Backend compile and processing tests pass.
3. Upload works with real face PNG, JPEG, and WebP samples.
4. Overlay colors, score cards, and zone breakdowns match the analysis metadata.
5. Keyboard focus, status messages, target sizes, and contrast meet WCAG 2.2 AA.
