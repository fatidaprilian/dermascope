"""Goal-based image processing engine for ImgLab."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import cv2 as cv
import numpy as np

from .errors import ApiError

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_DIMENSION = 4096
ACCEPTED_TYPES = {"image/png", "image/jpeg", "image/webp"}
OutputMode = Literal["color", "grayscale", "binary", "edge-map"]


@dataclass(frozen=True)
class Parameter:
    id: str
    label: str
    type: Literal["number", "select", "boolean"]
    default: int | float | str | bool
    min: int | float | None = None
    max: int | float | None = None
    step: int | float | None = None
    options: tuple[str, ...] = ()
    odd: bool = False


@dataclass(frozen=True)
class Operation:
    id: str
    category: str
    label: str
    description: str
    output_mode: OutputMode
    parameters: tuple[Parameter, ...]


@dataclass(frozen=True)
class Goal:
    id: str
    label: str
    summary: str
    operation_id: str
    intent: str


@dataclass(frozen=True)
class ProcessedImage:
    data: bytes
    media_type: str
    width: int
    height: int
    operation_id: str
    output_mode: OutputMode
    warnings: tuple[str, ...]


OPERATIONS: tuple[Operation, ...] = (
    Operation(
        "gaussian-blur",
        "restoration",
        "Gaussian blur",
        "Reduces mild noise with a weighted blur.",
        "color",
        (
            Parameter("kernelSize", "Kernel size", "number", 5, 3, 31, 2, odd=True),
            Parameter("sigma", "Sigma", "number", 1.5, 0, 10, 0.5),
        ),
    ),
    Operation(
        "median-filter",
        "restoration",
        "Median filter",
        "Removes isolated bright or dark specks.",
        "color",
        (Parameter("kernelSize", "Kernel size", "number", 5, 3, 15, 2, odd=True),),
    ),
    Operation(
        "bilateral-filter",
        "restoration",
        "Bilateral filter",
        "Smooths color noise while preserving more edge detail.",
        "color",
        (
            Parameter("diameter", "Diameter", "number", 7, 3, 15, 2, odd=True),
            Parameter("sigmaColor", "Sigma color", "number", 75, 10, 150, 5),
            Parameter("sigmaSpace", "Sigma space", "number", 75, 10, 150, 5),
        ),
    ),
    Operation("grayscale", "enhancement", "Grayscale", "Converts the image to luminance.", "grayscale", ()),
    Operation(
        "histogram-equalization",
        "enhancement",
        "Histogram equalization",
        "Improves global contrast on grayscale output.",
        "grayscale",
        (),
    ),
    Operation(
        "brightness-contrast",
        "enhancement",
        "Brightness & contrast",
        "Changes overall lightness and tonal separation.",
        "color",
        (
            Parameter("brightness", "Brightness", "number", 0, -100, 100, 1),
            Parameter("contrast", "Contrast", "number", 1.2, 0.25, 3, 0.05),
        ),
    ),
    Operation(
        "gamma-correction",
        "enhancement",
        "Gamma correction",
        "Adjusts midtones.",
        "color",
        (Parameter("gamma", "Gamma", "number", 1.2, 0.2, 3, 0.05),),
    ),
    Operation(
        "sharpen",
        "enhancement",
        "Sharpen",
        "Uses unsharp masking to emphasize detail.",
        "color",
        (
            Parameter("amount", "Amount", "number", 1, 0.2, 3, 0.1),
            Parameter("radius", "Radius", "number", 5, 3, 21, 2, odd=True),
        ),
    ),
    Operation(
        "canny-edge",
        "edge-segmentation",
        "Canny edge",
        "Detects strong image boundaries.",
        "edge-map",
        (
            Parameter("threshold1", "Low threshold", "number", 60, 0, 255, 1),
            Parameter("threshold2", "High threshold", "number", 150, 0, 255, 1),
            Parameter("apertureSize", "Aperture", "select", "3", options=("3", "5", "7")),
        ),
    ),
    Operation(
        "otsu-threshold",
        "edge-segmentation",
        "Otsu threshold",
        "Finds an automatic binary threshold.",
        "binary",
        (Parameter("invert", "Invert output", "boolean", False),),
    ),
    Operation(
        "adaptive-threshold",
        "edge-segmentation",
        "Adaptive threshold",
        "Builds a binary image from local neighborhoods.",
        "binary",
        (
            Parameter("blockSize", "Block size", "number", 11, 3, 51, 2, odd=True),
            Parameter("constant", "Constant", "number", 2, -20, 20, 1),
            Parameter("method", "Method", "select", "gaussian", options=("mean", "gaussian")),
        ),
    ),
    Operation("resize-bilinear", "upscaling", "Bilinear resize", "Fast interpolation baseline.", "color", (Parameter("scale", "Scale", "number", 2, 1, 4, 0.25),)),
    Operation("resize-bicubic", "upscaling", "Bicubic resize", "Smoother interpolation.", "color", (Parameter("scale", "Scale", "number", 2, 1, 4, 0.25),)),
    Operation("resize-lanczos", "upscaling", "Lanczos resize", "Sharper interpolation.", "color", (Parameter("scale", "Scale", "number", 2, 1, 4, 0.25),)),
    Operation("dilation", "morphology", "Dilation", "Expands bright foreground regions.", "color", (Parameter("kernelSize", "Kernel size", "number", 5, 3, 21, 2, odd=True), Parameter("iterations", "Iterations", "number", 1, 1, 5, 1))),
    Operation("erosion", "morphology", "Erosion", "Shrinks bright foreground regions.", "color", (Parameter("kernelSize", "Kernel size", "number", 5, 3, 21, 2, odd=True), Parameter("iterations", "Iterations", "number", 1, 1, 5, 1))),
    Operation("opening", "morphology", "Opening", "Removes small bright noise.", "color", (Parameter("kernelSize", "Kernel size", "number", 5, 3, 21, 2, odd=True), Parameter("iterations", "Iterations", "number", 1, 1, 5, 1))),
    Operation("closing", "morphology", "Closing", "Closes small gaps.", "color", (Parameter("kernelSize", "Kernel size", "number", 5, 3, 21, 2, odd=True), Parameter("iterations", "Iterations", "number", 1, 1, 5, 1))),
)

GOALS: tuple[Goal, ...] = (
    Goal("clean-noise", "Kurangi noise", "Untuk foto yang kasar atau berbintik.", "bilateral-filter", "Restorasi"),
    Goal("remove-specks", "Hapus bintik", "Untuk noise titik hitam/putih.", "median-filter", "Restorasi"),
    Goal("make-clear", "Perjelas detail", "Untuk membuat tepi dan tekstur lebih tegas.", "sharpen", "Enhancement"),
    Goal("fix-tone", "Perbaiki kontras", "Untuk gambar yang datar.", "histogram-equalization", "Enhancement"),
    Goal("adjust-light", "Atur terang", "Untuk mengubah brightness dan contrast.", "brightness-contrast", "Enhancement"),
    Goal("find-edges", "Cari tepi", "Untuk melihat batas objek.", "canny-edge", "Analysis"),
    Goal("scan-document", "Buat hitam-putih", "Untuk dokumen atau pencahayaan tidak rata.", "adaptive-threshold", "Threshold"),
    Goal("enlarge", "Besarkan gambar", "Untuk menaikkan resolusi.", "resize-bicubic", "Upscaling"),
    Goal("clean-shape", "Rapikan bentuk", "Untuk menutup celah kecil.", "closing", "Morphology"),
)


def operation_by_id(operation_id: str) -> Operation:
    for operation in OPERATIONS:
        if operation.id == operation_id:
            return operation
    raise ApiError("UNKNOWN_OPERATION", "Unknown image operation.", 400)


def goal_by_id(goal_id: str) -> Goal:
    for goal in GOALS:
        if goal.id == goal_id:
            return goal
    raise ApiError("UNKNOWN_GOAL", "Unknown image goal.", 400)


def goal_payload() -> list[dict[str, str]]:
    return [
        {
            "id": goal.id,
            "label": goal.label,
            "summary": goal.summary,
            "operationId": goal.operation_id,
            "intent": goal.intent,
        }
        for goal in GOALS
    ]


def validate_file(content_type: str | None, data: bytes) -> None:
    if content_type not in ACCEPTED_TYPES:
        raise ApiError("UNSUPPORTED_FILE_TYPE", "Choose a PNG, JPEG, or WebP image.", 415)
    if not data:
        raise ApiError("EMPTY_FILE", "The uploaded image is empty.", 400)
    if len(data) > MAX_FILE_SIZE:
        raise ApiError("FILE_TOO_LARGE", "The uploaded image is larger than 10 MB.", 413)


def decode_image(data: bytes) -> np.ndarray:
    buffer = np.frombuffer(data, dtype=np.uint8)
    image = cv.imdecode(buffer, cv.IMREAD_COLOR)
    if image is None or image.size == 0:
        raise ApiError("IMAGE_DECODE_FAILED", "The uploaded image could not be decoded.", 400)
    if max(image.shape[:2]) > MAX_DIMENSION:
        scale = MAX_DIMENSION / max(image.shape[:2])
        image = cv.resize(image, (round(image.shape[1] * scale), round(image.shape[0] * scale)), interpolation=cv.INTER_AREA)
    return image


def normalize_parameters(operation: Operation, incoming: dict[str, Any]) -> dict[str, Any]:
    values: dict[str, Any] = {}
    for parameter in operation.parameters:
        raw = incoming.get(parameter.id, parameter.default)
        if parameter.type == "number":
            values[parameter.id] = _normalize_number(raw, parameter)
        elif parameter.type == "select":
            text = str(raw)
            values[parameter.id] = text if text in parameter.options else parameter.default
        elif parameter.type == "boolean":
            values[parameter.id] = raw is True or str(raw).lower() in {"true", "1", "on", "yes"}
    return values


def _normalize_number(raw: Any, parameter: Parameter) -> int | float:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        value = float(parameter.default)
    if parameter.min is not None:
        value = max(float(parameter.min), value)
    if parameter.max is not None:
        value = min(float(parameter.max), value)
    if parameter.odd:
        value = int(round(value))
        if value % 2 == 0:
            value += 1
        if parameter.max is not None and value > parameter.max:
            value -= 2
        if parameter.min is not None and value < parameter.min:
            value = int(parameter.min)
        return value
    return int(value) if parameter.step == 1 else value


def process_goal(data: bytes, content_type: str | None, goal_id: str, parameters: dict[str, Any]) -> ProcessedImage:
    validate_file(content_type, data)
    goal = goal_by_id(goal_id)
    operation = operation_by_id(goal.operation_id)
    image = decode_image(data)
    normalized = normalize_parameters(operation, parameters)
    result, warnings = _apply_operation(image, operation, normalized)
    success, encoded = cv.imencode(".png", result)
    if not success:
        raise ApiError("EXPORT_FAILED", "The processed image could not be encoded.", 500)
    height, width = result.shape[:2]
    return ProcessedImage(
        data=encoded.tobytes(),
        media_type="image/png",
        width=width,
        height=height,
        operation_id=operation.id,
        output_mode=operation.output_mode,
        warnings=tuple(warnings),
    )


def _apply_operation(image: np.ndarray, operation: Operation, p: dict[str, Any]) -> tuple[np.ndarray, list[str]]:
    warnings: list[str] = []
    if operation.id == "gaussian-blur":
        return cv.GaussianBlur(image, (p["kernelSize"], p["kernelSize"]), p["sigma"]), warnings
    if operation.id == "median-filter":
        return cv.medianBlur(image, p["kernelSize"]), warnings
    if operation.id == "bilateral-filter":
        return cv.bilateralFilter(image, p["diameter"], p["sigmaColor"], p["sigmaSpace"]), warnings
    if operation.id == "grayscale":
        warnings.append("Hasil dibuat grayscale.")
        gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        return cv.cvtColor(gray, cv.COLOR_GRAY2BGR), warnings
    if operation.id == "histogram-equalization":
        warnings.append("Histogram equalization memakai output grayscale di MVP.")
        gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        return cv.cvtColor(cv.equalizeHist(gray), cv.COLOR_GRAY2BGR), warnings
    if operation.id == "brightness-contrast":
        return cv.convertScaleAbs(image, alpha=p["contrast"], beta=p["brightness"]), warnings
    if operation.id == "gamma-correction":
        gamma = max(0.01, p["gamma"])
        table = np.array([min(255, round(255 * ((i / 255) ** (1 / gamma)))) for i in range(256)], dtype=np.uint8)
        return cv.LUT(image, table), warnings
    if operation.id == "sharpen":
        blur = cv.GaussianBlur(image, (p["radius"], p["radius"]), 0)
        return cv.addWeighted(image, 1 + p["amount"], blur, -p["amount"], 0), warnings
    if operation.id == "canny-edge":
        warnings.append("Canny menghasilkan peta tepi.")
        gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        edges = cv.Canny(gray, p["threshold1"], p["threshold2"], apertureSize=int(p["apertureSize"]))
        return cv.cvtColor(edges, cv.COLOR_GRAY2BGR), warnings
    if operation.id == "otsu-threshold":
        warnings.append("Otsu menghasilkan output biner.")
        gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        mode = cv.THRESH_BINARY_INV if p["invert"] else cv.THRESH_BINARY
        _, binary = cv.threshold(gray, 0, 255, mode + cv.THRESH_OTSU)
        return cv.cvtColor(binary, cv.COLOR_GRAY2BGR), warnings
    if operation.id == "adaptive-threshold":
        warnings.append("Adaptive threshold menghasilkan output biner.")
        gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
        method = cv.ADAPTIVE_THRESH_MEAN_C if p["method"] == "mean" else cv.ADAPTIVE_THRESH_GAUSSIAN_C
        binary = cv.adaptiveThreshold(gray, 255, method, cv.THRESH_BINARY, p["blockSize"], p["constant"])
        return cv.cvtColor(binary, cv.COLOR_GRAY2BGR), warnings
    if operation.id in {"resize-bilinear", "resize-bicubic", "resize-lanczos"}:
        interpolation = {
            "resize-bilinear": cv.INTER_LINEAR,
            "resize-bicubic": cv.INTER_CUBIC,
            "resize-lanczos": cv.INTER_LANCZOS4,
        }[operation.id]
        return cv.resize(image, None, fx=p["scale"], fy=p["scale"], interpolation=interpolation), warnings
    if operation.id in {"dilation", "erosion", "opening", "closing"}:
        kernel = np.ones((p["kernelSize"], p["kernelSize"]), dtype=np.uint8)
        if operation.id == "dilation":
            return cv.dilate(image, kernel, iterations=p["iterations"]), warnings
        if operation.id == "erosion":
            return cv.erode(image, kernel, iterations=p["iterations"]), warnings
        if operation.id == "opening":
            return cv.morphologyEx(image, cv.MORPH_OPEN, kernel, iterations=p["iterations"]), warnings
        return cv.morphologyEx(image, cv.MORPH_CLOSE, kernel, iterations=p["iterations"]), warnings
    raise ApiError("UNKNOWN_OPERATION", "Unknown image operation.", 400)
