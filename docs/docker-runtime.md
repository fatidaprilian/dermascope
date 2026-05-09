# Docker Runtime

ImgLab has separate Docker lanes for development and production.

## Files

- `compose.yaml`: development entrypoint.
- `compose.prod.yaml`: production entrypoint.
- `docker/frontend.Dockerfile`: frontend development and production targets.
- `docker/backend.Dockerfile`: backend development and production targets.
- `docker/nginx.conf`: production frontend server and `/api/` reverse proxy.
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

- `frontend`: Nginx on host port `8080`.
- `backend`: FastAPI exposed only inside the Compose network.

The production frontend proxies `/api/` to the backend service, so users can leave the backend URL field empty and use same-origin API calls.

Expected command:

```bash
docker compose -f compose.prod.yaml up --build
```

Production URL:

```text
http://localhost:8080
```

## Design Rationale

- `compose.yaml` is used instead of legacy `docker-compose.yml` naming.
- Compose files do not include a top-level `version` field.
- Frontend and backend images have separate development and production targets.
- Production backend runs as a non-root user.
- Production frontend uses Nginx and keeps API traffic same-origin through `/api/`.
- Images do not bake secrets into layers.
- Health checks use service-local endpoints.

## Official Docker Evidence

- Docker Dockerfile best practices recommend trusted minimal base images, multi-stage builds, `.dockerignore`, and avoiding unnecessary packages. Source: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/, fetched 2026-05-07.
- Docker Compose file reference documents the Compose Specification as the current format and Compose V2 as the current CLI implementation. Source: https://docs.docker.com/reference/compose-file/, fetched 2026-05-07.
- Docker multi-stage docs describe multiple named build stages and copying only what is needed into later stages. Source: https://docs.docker.com/build/building/multi-stage/, fetched 2026-05-07.
- Docker Compose Watch docs require Compose 2.22.0 or later. This project uses bind mounts for the current development lane because the source tree is small and explicit mounts are enough. Source: https://docs.docker.com/compose/how-tos/file-watch/, fetched 2026-05-07.

## Next Validation Action

Run the development and production Compose lanes, then test upload, goal processing, and PNG export through browser mode and backend mode.
