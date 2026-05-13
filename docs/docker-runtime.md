# Docker Runtime

DermaScope has separate Docker lanes for development and production. Development keeps frontend and backend split for hot reload. Production is a monolith service so small-project deployment stays simple.

## Files

- `compose.yaml`: development entrypoint.
- `compose.prod.yaml`: production monolith entrypoint.
- `docker/frontend.Dockerfile`: frontend development and production targets.
- `docker/backend.Dockerfile`: backend development and production targets.
- `docker/monolith.Dockerfile`: production single-container build for React static assets plus FastAPI.
- `docker/nginx.conf`: legacy split-service frontend server and `/api/` reverse proxy.
- `.dockerignore`: keeps build contexts small and prevents local state from entering images.

## Development Lane

Development uses `compose.yaml`.

Services:

- `frontend`: Node 22 static server on port `4173`.
- `backend`: FastAPI with reload on port `8000`.

The development lane uses bind mounts for `index.html`, `src/`, `scripts/`, and `backend/` so local edits are visible without rebuilding everything.

Expected command:

```bash
docker compose up --build
```

Frontend URL:

```text
http://localhost:4173
```

Backend URL:

```text
http://localhost:8000
```

## Production Lane

Production uses `compose.prod.yaml`.

Services:

- `app`: one FastAPI service on host port `8080`.

The production image builds the React frontend, copies `frontend/dist` into the Python runtime image, and lets FastAPI serve both static frontend files and `/api/*`.

Expected command:

```bash
docker compose -f compose.prod.yaml up -d --build
```

Production URL:

```text
http://localhost:8080
```

## Design Rationale

- `compose.yaml` is used instead of legacy `docker-compose.yml` naming.
- Compose files do not include a top-level `version` field.
- Development frontend and backend images stay separate for speed.
- Production uses one multi-stage Dockerfile to keep deploys simple on one-service platforms.
- Production app runs as a non-root user.
- API traffic stays same-origin through the same FastAPI process.
- Images do not bake secrets into layers.
- Health checks use service-local endpoints.

## Official Docker Evidence

- Docker Dockerfile best practices recommend trusted minimal base images, multi-stage builds, `.dockerignore`, and avoiding unnecessary packages. Source: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/, fetched 2026-05-13.
- Docker Compose file reference documents the Compose Specification as the current format and Compose V2 as the current CLI implementation. Source: https://docs.docker.com/reference/compose-file/, fetched 2026-05-07.
- Docker multi-stage docs describe multiple named build stages and copying only what is needed into later stages. Source: https://docs.docker.com/build/building/multi-stage/, fetched 2026-05-13.

## Leapcell Monolith Notes

Leapcell deploys a service with a build command, start command, and serving port. For a one-service DermaScope deploy on the Python runtime, keep `frontend/dist` committed and use the monolith shape below. This avoids requiring `npm` inside Leapcell's Python build image.

Build command:

```bash
apt-get update && apt-get install -y libglib2.0-0 libgomp1 && python -m pip install -r backend/requirements.txt
```

Start command:

```bash
uvicorn imglab_api.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8080}
```

Serving port:

```text
8080
```

Source: https://docs.leapcell.io/overview and https://docs.leapcell.io/service/, fetched 2026-05-13.

Before deploying after frontend changes, build the frontend locally and commit the updated `frontend/dist` files:

```bash
npm run build
```
- Docker Compose Watch docs require Compose 2.22.0 or later. This project uses bind mounts for the current development lane because the source tree is small and explicit mounts are enough. Source: https://docs.docker.com/compose/how-tos/file-watch/, fetched 2026-05-07.

## Next Validation Action

Run the development and production Compose lanes, then test upload, camera capture, overlay markers, and `/api/process` with real face photos.
