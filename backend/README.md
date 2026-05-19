# DermaScope Backend

Python FastAPI backend for in-memory facial skin signal analysis with OpenCV-Python.

## Setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

## Run

```bash
npm run backend
```

The API runs at `http://localhost:8000`.

## Endpoints

- `GET /api/health`
- `GET /api/goals`
- `POST /api/process`

`POST /api/process` accepts `multipart/form-data` with `file`, `goal_id=skin-health-analysis`, and optional `parameters` JSON object string. It returns an overlay PNG with `X-DermaScope-*` metadata headers.

## Validation

```bash
npm run test:backend
```

Backend tests require the Python dependencies from `backend/requirements.txt`.
