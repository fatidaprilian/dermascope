# ImgLab

ImgLab is a browser-first image processing workbench for quick visual restoration, enhancement, analysis, upscaling, and morphology experiments. Users upload an image, choose a result goal, compare the processed output against the original, and export the result as PNG, JPEG, or WebP.

## Who It Is For

ImgLab is for students, instructors, and image-workflow users who need explainable processing without account setup or project storage. The interface presents user goals first, then shows the technical operation as supporting metadata.

## Current Capabilities

- Upload PNG, JPEG, or WebP images up to 10 MB.
- Choose goal-based operations such as reduce noise, improve contrast, sharpen, find edges, enlarge, or clean shape masks.
- Compare original and processed images with a test-strip wipe control.
- Export processed output as PNG, JPEG, or WebP where supported by the browser.
- Use the optional FastAPI backend for OpenCV-Python processing through same-origin `/api` routes in production.

## Project Structure

- `frontend/`: React + Vite frontend.
- `frontend/src/utils/operations.js`: goal and operation registry.
- `frontend/src/App.jsx`: public workbench UI.
- `backend/`: optional FastAPI backend for image processing.
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

Run a production build check:

```bash
npm run build
```

Run frontend lint:

```bash
cd frontend
npm run lint
```

## Optional Backend

The frontend calls:

- `GET /api/health`
- `POST /api/process`

For local backend development, use the documented backend environment and run:

```bash
npm run backend
```

Docker development and production flows are documented in `docs/docker-runtime.md`.

## Documentation

- `docs/project-brief.md`: product scope and requirements.
- `docs/architecture-decision-record.md`: runtime and architecture decisions.
- `docs/flow-overview.md`: user, processing, export, and error flows.
- `docs/api-contract.md`: public UI and HTTP API contracts.
- `docs/database-schema.md`: in-memory data model and persistence decision.
- `docs/DESIGN.md`: human-readable design contract.
- `docs/design-intent.json`: machine-readable design intent.

## Validation

Before release, validate:

1. Frontend build and lint pass.
2. Upload and processing work with real PNG, JPEG, and WebP samples.
3. Exported PNG, JPEG, and WebP files open correctly.
4. Keyboard focus, comparison slider, status messages, and contrast meet WCAG 2.2 AA.
