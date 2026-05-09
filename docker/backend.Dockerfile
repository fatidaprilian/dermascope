# syntax=docker/dockerfile:1

FROM python:3.12-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /tmp/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r /tmp/requirements.txt

FROM base AS development

COPY backend /app/backend

EXPOSE 8000
CMD ["uvicorn", "imglab_api.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production

RUN groupadd --system imglab \
    && useradd --system --gid imglab --create-home --home-dir /home/imglab imglab

COPY --chown=imglab:imglab backend /app/backend

USER imglab

EXPOSE 8000
CMD ["uvicorn", "imglab_api.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
