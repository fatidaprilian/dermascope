# Architecture Decision Record

## ADR-001: Browser-First Image Processing Toolkit

Status: Proposed

Date: 2026-05-07

## Context

ImgLab needs to demonstrate digital image processing methods such as restoration, enhancement, upscaling, edge detection, thresholding, and morphology. The user asked for documentation first and asked that the project only list methods that will really be implemented.

The repository does not yet contain an application runtime, package metadata, backend code, or database schema. Technical decisions must therefore be explicit recommendations, not assumptions from existing code.

## Decision

Build ImgLab as a browser-first single page application.

Use OpenCV.js as the first client-side image processing engine, with a FastAPI backend available for server-side processing when preferred. Keep image files local in the browser for MVP unless backend mode is explicitly used.

The current implementation uses React + Vite with Tailwind CSS and DaisyUI. The legacy static HTML build remains in the repo but is no longer the primary UI.

The project includes a Python FastAPI backend for server-side image processing. This backend is optional at runtime: the UI can process locally or send the image to `POST /api/process` when backend mode is enabled.

Recommended implementation shape:

- UI shell: `frontend/index.html`, `frontend/src/App.jsx`, and `frontend/src/index.css`.
- Operation contract: `frontend/src/utils/operations.js` and `src/operations.js` (legacy).
- Processing engine: `frontend/src/utils/image-processing.js` (client) and `backend/imglab_api/processing.py` (server).
- Backend processing engine: `backend/imglab_api/processing.py`, mapping goal IDs to OpenCV-Python operations.
- Backend transport: `backend/imglab_api/main.py`, exposing health, goal metadata, and process endpoints.
- Static server: `scripts/static-server.js` for local development without external npm packages.
- Docker development lane: `compose.yaml`.
- Docker production lane: `compose.prod.yaml`.
- Export boundary: writes the processed canvas to a local downloadable file.

## Rationale

This architecture matches the current project size and coursework goal.

- It avoids a backend before there is a real server-side need.
- It keeps user images private by default because files stay on the local device.
- It makes the processing result visible immediately through canvas previews.
- It keeps deployment simple: static assets can be served by a basic web server or container.
- It leaves room for a future server worker if deep-learning super-resolution is approved later.

## Runtime Recommendation

Use React + Vite for the current MVP frontend.

Use OpenCV.js for client-side operations where needed, and FastAPI with OpenCV-Python for optional backend processing. The backend accepts multipart image uploads, validates file type and size, processes by `goal_id`, and returns PNG bytes.

Use Docker Compose for development and production. The React frontend is the primary UI surface.

Docker is now materialized:

- Development uses `compose.yaml` with frontend port `4173` and backend port `8000`.
- Production uses `compose.prod.yaml` with Nginx on port `8080` and backend-only internal exposure.
- Production routes `/api/` through Nginx to the backend, so backend mode can use same-origin API calls.

### Evidence

- OpenCV.js official docs cover browser usage, `cv.imread`, `cv.imshow`, and image processing tutorials. Source: https://docs.opencv.org/4.x/d0/d84/tutorial_js_usage.html, fetched 2026-05-07.
- OpenCV.js image processing docs list smoothing, thresholding, morphology, histograms, Canny edge detection, and geometric transforms. Source: https://docs.opencv.org/4.x/d2/df0/tutorial_js_table_of_contents_imgproc.html, fetched 2026-05-07.
- FastAPI official docs document `UploadFile` for receiving uploaded files. Source: https://fastapi.tiangolo.com/reference/uploadfile/, fetched 2026-05-07.
- OpenCV official docs document image decoding and encoding APIs used for server-side image bytes. Source: https://docs.opencv.org/4.x/d4/da8/group__imgcodecs.html, fetched 2026-05-07.
- Vite official docs describe a dev server, production build command, and React template support. This remains a future option, not the current implementation. Source: https://vite.dev/guide/, fetched 2026-05-07.
- Docker Compose official docs describe `compose.yaml` as the preferred Compose file and explain service-based app definitions. Source: https://docs.docker.com/compose/intro/compose-application-model/, fetched 2026-05-07.
- Docker Dockerfile best practices recommend minimal trusted base images, multi-stage builds, `.dockerignore`, and avoiding unnecessary packages. Source: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/, fetched 2026-05-07.
- Docker Compose file reference documents the Compose Specification as the current format and Compose V2 as the current CLI implementation. Source: https://docs.docker.com/reference/compose-file/, fetched 2026-05-07.
- Docker multi-stage docs describe named build stages and copying only needed files into final stages. Source: https://docs.docker.com/build/building/multi-stage/, fetched 2026-05-07.

## Public Boundaries

ImgLab should expose these internal contracts before implementation:

- `ImageInput`: validated local image file and decoded bitmap metadata.
- `OperationDefinition`: method ID, category, parameter schema, default values, and processing handler.
- `ProcessingRequest`: source image reference, operation ID, and parameter values.
- `ProcessingResult`: processed bitmap or canvas data, timing metadata, warnings, and export metadata.
- `ProcessingError`: stable error code, safe message, and optional recovery action.

## Data Decision

Do not add a database for MVP. Store images and settings only in browser memory. Use optional local browser storage later only for non-sensitive UI preferences.

## Auth Decision

Do not add authentication for MVP. There are no accounts, shared assets, or remote jobs in the first version.

## Consequences

Positive:

- The first version stays small and testable.
- Users can try processing without account setup.
- Privacy risk is lower because files are not uploaded.
- The tool can run as a static site when backend mode is off.
- The backend gives a path for heavier server-side processing without changing the goal-first UI.

Tradeoffs:

- Very large images can stress browser or backend memory.
- Deep-learning super-resolution is not practical in the first version.
- Browser support must be tested with canvas, worker, and OpenCV.js loading behavior.

## Rejected Alternatives

### Python Backend First

Rejected for MVP. Python with native OpenCV is strong for image processing, but it adds upload handling, storage risk, server setup, and deployment work before the project needs those pieces.

### Deep-Learning Super-Resolution First

Rejected for MVP. It would shift the project from explainable image processing methods into model packaging and compute constraints.

### Multi-Service Architecture

Rejected for MVP. There is no evidence for independent scaling, separate teams, or hard fault-isolation needs.

## Assumptions to Validate

- The current browser-first web app direction remains approved.
- The first implementation can use OpenCV.js by default and OpenCV-Python when backend mode is enabled.
- The first version does not need user accounts, a database, or cloud uploads.

## Next Validation Action

Run the development and production Docker lanes, then manually test browser processing and backend processing with the same sample image.
