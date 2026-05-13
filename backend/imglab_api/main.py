"""FastAPI transport layer for DermaScope."""

from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .errors import ApiError
from .processing import goal_payload, process_goal

app = FastAPI(
    title="DermaScope API",
    version="0.1.0",
    description="Facial skin analysis API for DermaScope.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(ApiError)
async def handle_api_error(_request: Request, error: ApiError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content=error.to_response())


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, _error: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "code": "INTERNAL_ERROR",
            "message": "The image could not be processed.",
        },
    )


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "engine": "opencv-python"}


@app.get("/api/goals")
async def goals() -> dict[str, list[dict[str, str]]]:
    return {"goals": goal_payload()}


@app.post("/api/process")
async def process_image(
    file: Annotated[UploadFile, File()],
    goal_id: Annotated[str, Form()],
    parameters: Annotated[str, Form()] = "{}",
) -> Response:
    try:
        parsed_parameters: dict[str, Any] = json.loads(parameters)
    except json.JSONDecodeError as exc:
        raise ApiError("INVALID_PARAMETERS", "Parameters must be valid JSON.", 400) from exc
    if not isinstance(parsed_parameters, dict):
        raise ApiError("INVALID_PARAMETERS", "Parameters must be a JSON object.", 400)

    image_bytes = await file.read()
    processed = process_goal(image_bytes, file.content_type, goal_id, parsed_parameters)
    return Response(
        content=processed.data,
        media_type=processed.media_type,
        headers={
            "X-ImgLab-Operation": processed.operation_id,
            "X-ImgLab-Output-Mode": processed.output_mode,
            "X-ImgLab-Width": str(processed.width),
            "X-ImgLab-Height": str(processed.height),
            "X-ImgLab-Warnings": json.dumps(processed.warnings),
            "X-DermaScope-Analysis": json.dumps(processed.analysis or {}),
            "Content-Disposition": f'attachment; filename="dermascope-{goal_id}.png"',
        },
    )
