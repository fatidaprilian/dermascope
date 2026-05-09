# ImgLab Backend

Python FastAPI backend for optional server-side image processing.

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

`POST /api/process` accepts `multipart/form-data` with `file`, `goal_id`, and optional `parameters` JSON string. It returns processed PNG bytes.

## Validation

```bash
npm run test:backend
```

Backend tests require the Python dependencies from `backend/requirements.txt`.
