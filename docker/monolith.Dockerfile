# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim-bookworm AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r /tmp/requirements.txt

RUN groupadd --system dermascope \
    && useradd --system --gid dermascope --create-home --home-dir /home/dermascope dermascope

COPY --chown=dermascope:dermascope backend /app/backend
COPY --from=frontend-build --chown=dermascope:dermascope /app/dist /app/frontend/dist

USER dermascope

EXPOSE 8080
CMD ["sh", "-c", "uvicorn imglab_api.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8080}"]
