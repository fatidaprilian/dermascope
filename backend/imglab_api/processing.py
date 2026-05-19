"""Goal-based image processing engine for DermaScope."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import cv2 as cv
import numpy as np

from .errors import ApiError

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_DIMENSION = 4096
ACCEPTED_TYPES = {"image/png", "image/jpeg", "image/webp"}
SKIN_ANALYSIS_GOAL_ID = "skin-health-analysis"
SKIN_ANALYSIS_OPERATION_ID = "facial-skin-analysis"


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
    output_mode: str
    warnings: tuple[str, ...]
    analysis: dict[str, Any] | None = None


GOALS: tuple[Goal, ...] = (
    Goal(
        SKIN_ANALYSIS_GOAL_ID,
        "Analisis kondisi kulit",
        "Deteksi jerawat, noda gelap, kerutan, kemerahan, dan pori dari satu foto wajah.",
        SKIN_ANALYSIS_OPERATION_ID,
        "Analisis Kulit",
    ),
)


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


def process_goal(data: bytes, content_type: str | None, goal_id: str, parameters: dict[str, Any]) -> ProcessedImage:
    validate_file(content_type, data)
    goal_by_id(goal_id)
    if parameters:
        # The public DermaScope operation has no tunable parameters yet. Keep the
        # field accepted for stable multipart shape, but do not let it affect output.
        parameters = {}
    image = decode_image(data)
    result, warnings, analysis = _analyze_facial_skin(image)
    success, encoded = cv.imencode(".png", result)
    if not success:
        raise ApiError("EXPORT_FAILED", "The processed image could not be encoded.", 500)
    height, width = result.shape[:2]
    return ProcessedImage(
        data=encoded.tobytes(),
        media_type="image/png",
        width=width,
        height=height,
        operation_id=SKIN_ANALYSIS_OPERATION_ID,
        output_mode="overlay",
        warnings=tuple(warnings),
        analysis=analysis,
    )


def _analyze_facial_skin(image: np.ndarray) -> tuple[np.ndarray, list[str], dict[str, Any]]:
    warnings: list[str] = []
    face, detected = _detect_face(image)
    if not detected:
        warnings.append("Face detector used a centered fallback region.")

    x, y, w, h = face
    roi = image[y : y + h, x : x + w]
    normalized_roi = _normalize_lighting(roi)
    skin_mask = _skin_mask(normalized_roi)
    zones = _zone_rects(w, h)
    condition_masks = {key: np.zeros(image.shape[:2], dtype=np.uint8) for key in CONDITION_META}
    zone_payload: list[dict[str, Any]] = []
    category_accumulator = {key: {"coverage": 0.0, "count": 0} for key in CONDITION_META}

    for zone_id, label, rect in zones:
        zx, zy, zw, zh = rect
        zone_img = normalized_roi[zy : zy + zh, zx : zx + zw]
        zone_skin = skin_mask[zy : zy + zh, zx : zx + zw]
        zone_area = max(1, int(np.count_nonzero(zone_skin)))
        measurements = _measure_zone(zone_img, zone_skin)

        concerns: dict[str, float] = {}
        for key, measurement in measurements.items():
            coverage = float(measurement["coverage"])
            count = int(measurement.get("count", 0))
            category_accumulator[key]["coverage"] += coverage
            category_accumulator[key]["count"] += count
            concerns[key] = coverage

            local_mask = measurement["mask"]
            if local_mask.size:
                target = condition_masks[key][y + zy : y + zy + zh, x + zx : x + zx + zw]
                target[local_mask > 0] = 255

        zone_penalty = min(65.0, sum(concerns.values()) * 1.8)
        dominant = max(concerns, key=concerns.get) if concerns else "none"
        zone_payload.append(
            {
                "id": zone_id,
                "label": label,
                "score": _score_from_penalty(zone_penalty),
                "dominantConcern": CONDITION_META[dominant]["label"] if dominant in CONDITION_META else "Tidak dominan",
                "skinPixels": zone_area,
            }
        )

    category_payload = []
    zone_count = max(1, len(zones))
    for key, meta in CONDITION_META.items():
        avg_coverage = category_accumulator[key]["coverage"] / zone_count
        count = int(category_accumulator[key]["count"])
        penalty = min(82.0, avg_coverage * meta["weight"] + min(24.0, count * meta["count_weight"]))
        score = _score_from_penalty(penalty)
        category_payload.append(
            {
                "id": key,
                "label": meta["label"],
                "score": score,
                "severity": _severity(score),
                "count": count,
                "coverage": round(avg_coverage, 2),
            }
        )

    overall = round(sum(item["score"] for item in category_payload) / len(category_payload))
    overlay = _render_overlay(image, face, condition_masks)
    analysis = {
        "overallScore": overall,
        "faceDetected": detected,
        "warning": warnings[0] if warnings else None,
        "categories": category_payload,
        "zones": zone_payload,
        "legend": [
            {"id": key, "label": meta["label"], "color": meta["hex"]}
            for key, meta in CONDITION_META.items()
        ],
    }
    return overlay, warnings, analysis


CONDITION_META: dict[str, dict[str, Any]] = {
    "acne": {"label": "Jerawat", "short": "Acne", "hex": "#ff5a1f", "bgr": (31, 90, 255), "weight": 2.2, "count_weight": 1.8},
    "dark_spots": {"label": "Noda gelap", "short": "Spot", "hex": "#8a4d00", "bgr": (0, 77, 138), "weight": 2.0, "count_weight": 0.8},
    "wrinkles": {"label": "Kerutan", "short": "Line", "hex": "#007b8f", "bgr": (143, 123, 0), "weight": 1.7, "count_weight": 0.15},
    "redness": {"label": "Kemerahan", "short": "Red", "hex": "#d1007f", "bgr": (127, 0, 209), "weight": 1.6, "count_weight": 0.25},
    "pores": {"label": "Pori besar", "short": "Pore", "hex": "#617a1f", "bgr": (31, 122, 97), "weight": 1.4, "count_weight": 0.08},
}


def _detect_face(image: np.ndarray) -> tuple[tuple[int, int, int, int], bool]:
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    cascade_path = cv.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv.CascadeClassifier(cascade_path)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)) if not cascade.empty() else ()
    if len(faces) > 0:
        x, y, w, h = max(faces, key=lambda item: item[2] * item[3])
        return (int(x), int(y), int(w), int(h)), True

    height, width = image.shape[:2]
    size = int(min(width, height) * 0.72)
    x = max(0, (width - size) // 2)
    y = max(0, int((height - size) * 0.42))
    return (x, y, min(size, width - x), min(size, height - y)), False


def _skin_mask(face: np.ndarray) -> np.ndarray:
    ycrcb = cv.cvtColor(face, cv.COLOR_BGR2YCrCb)
    hsv = cv.cvtColor(face, cv.COLOR_BGR2HSV)
    lower = np.array([30, 128, 75], dtype=np.uint8)
    upper = np.array([245, 188, 148], dtype=np.uint8)
    color_mask = cv.inRange(ycrcb, lower, upper)
    hsv_mask = cv.inRange(hsv, np.array([0, 18, 45], dtype=np.uint8), np.array([35, 185, 255], dtype=np.uint8))
    mask = cv.bitwise_and(color_mask, hsv_mask)
    kernel = np.ones((5, 5), dtype=np.uint8)
    mask = cv.morphologyEx(mask, cv.MORPH_OPEN, kernel)
    mask = cv.morphologyEx(mask, cv.MORPH_CLOSE, kernel)
    if np.count_nonzero(mask) < face.shape[0] * face.shape[1] * 0.12:
        mask = np.zeros(face.shape[:2], dtype=np.uint8)
        center = (face.shape[1] // 2, int(face.shape[0] * 0.54))
        axes = (int(face.shape[1] * 0.36), int(face.shape[0] * 0.42))
        cv.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
    return mask


def _normalize_lighting(face: np.ndarray) -> np.ndarray:
    lab = cv.cvtColor(face, cv.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv.split(lab)
    clahe = cv.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    normalized_l = clahe.apply(l_channel)
    normalized_lab = cv.merge((normalized_l, a_channel, b_channel))
    return cv.cvtColor(normalized_lab, cv.COLOR_LAB2BGR)


def _zone_rects(width: int, height: int) -> tuple[tuple[str, str, tuple[int, int, int, int]], ...]:
    return (
        ("forehead", "Dahi", (int(width * 0.20), int(height * 0.08), int(width * 0.60), int(height * 0.20))),
        ("left_cheek", "Pipi kiri", (0, int(height * 0.32), int(width * 0.42), int(height * 0.38))),
        ("right_cheek", "Pipi kanan", (int(width * 0.58), int(height * 0.32), int(width * 0.42), int(height * 0.38))),
        ("nose", "Hidung", (int(width * 0.38), int(height * 0.30), int(width * 0.24), int(height * 0.44))),
        ("chin", "Dagu", (int(width * 0.26), int(height * 0.70), int(width * 0.48), int(height * 0.30))),
    )


def _measure_zone(zone: np.ndarray, skin: np.ndarray) -> dict[str, dict[str, Any]]:
    b, g, r = cv.split(zone)
    gray = cv.cvtColor(zone, cv.COLOR_BGR2GRAY)
    valid = skin > 0
    baseline = float(np.median(gray[valid])) if np.any(valid) else float(np.median(gray))
    red_dominance = r.astype(np.int16) - ((g.astype(np.int16) + b.astype(np.int16)) // 2)
    red_base = float(np.median(red_dominance[valid])) if np.any(valid) else float(np.median(red_dominance))
    red_strong = red_dominance > max(30, red_base + 24)
    red_soft = red_dominance > max(24, red_base + 18)

    acne = np.where(valid & red_strong & (gray < baseline + 28), 255, 0).astype(np.uint8)
    acne = _small_blob_mask(acne, min_area=8, max_area=160)

    dark = np.where(valid & (gray < baseline - 26) & ~red_strong, 255, 0).astype(np.uint8)
    dark = _small_blob_mask(dark, min_area=12, max_area=380)

    redness = np.where(valid & red_soft & (gray > baseline - 18), 255, 0).astype(np.uint8)
    redness = cv.morphologyEx(redness, cv.MORPH_OPEN, np.ones((5, 5), dtype=np.uint8))
    redness = cv.morphologyEx(redness, cv.MORPH_CLOSE, np.ones((7, 7), dtype=np.uint8))

    edges = cv.Canny(cv.GaussianBlur(gray, (3, 3), 0), 45, 120)
    line_kernel = cv.getStructuringElement(cv.MORPH_RECT, (5, 1))
    wrinkles = np.where(valid & (edges > 0) & (gray < baseline + 24), 255, 0).astype(np.uint8)
    wrinkles = cv.morphologyEx(wrinkles, cv.MORPH_OPEN, line_kernel)

    laplacian = cv.Laplacian(gray, cv.CV_16S, ksize=3)
    texture = cv.convertScaleAbs(laplacian)
    texture_base = float(np.percentile(texture[valid], 68)) if np.any(valid) else float(np.percentile(texture, 68))
    pores = np.where(valid & (texture > max(28, texture_base + 8)) & (red_dominance < red_base + 32), 255, 0).astype(np.uint8)
    pores = cv.morphologyEx(pores, cv.MORPH_OPEN, np.ones((2, 2), dtype=np.uint8))

    return {
        "acne": _measurement(acne, skin),
        "dark_spots": _measurement(dark, skin),
        "wrinkles": _measurement(wrinkles, skin),
        "redness": _measurement(redness, skin),
        "pores": _measurement(pores, skin),
    }


def _small_blob_mask(mask: np.ndarray, min_area: int, max_area: int) -> np.ndarray:
    count, labels, stats, _centroids = cv.connectedComponentsWithStats(mask, connectivity=8)
    output = np.zeros_like(mask)
    for index in range(1, count):
        area = int(stats[index, cv.CC_STAT_AREA])
        if min_area <= area <= max_area:
            output[labels == index] = 255
    return output


def _measurement(mask: np.ndarray, skin: np.ndarray) -> dict[str, Any]:
    skin_area = max(1, int(np.count_nonzero(skin)))
    count, _labels, stats, _centroids = cv.connectedComponentsWithStats(mask, connectivity=8)
    areas = [int(stats[index, cv.CC_STAT_AREA]) for index in range(1, count)]
    active = sum(areas)
    return {
        "coverage": round((active / skin_area) * 100, 2),
        "count": len([area for area in areas if area >= 4]),
        "mask": mask,
    }


def _render_overlay(image: np.ndarray, face: tuple[int, int, int, int], masks: dict[str, np.ndarray]) -> np.ndarray:
    result = image.copy()
    color_layer = np.zeros_like(result)
    for key, mask in masks.items():
        color_layer[mask > 0] = CONDITION_META[key]["bgr"]
    blended = cv.addWeighted(result, 0.86, color_layer, 0.30, 0)
    result[np.any(color_layer > 0, axis=2)] = blended[np.any(color_layer > 0, axis=2)]
    x, y, w, h = face
    survey_color = (180, 166, 0)
    cv.rectangle(result, (x, y), (x + w, y + h), survey_color, 2)
    _put_label(result, "Face ROI", (x + 8, max(18, y + 22)), survey_color)
    for _zone_id, label, (zx, zy, zw, zh) in _zone_rects(w, h):
        top_left = (x + zx, y + zy)
        bottom_right = (x + zx + zw, y + zy + zh)
        cv.rectangle(result, top_left, bottom_right, survey_color, 1)
        _put_label(result, label, (top_left[0] + 4, top_left[1] + 16), survey_color, scale=0.38)
    _draw_condition_annotations(result, masks)
    return result


def _draw_condition_annotations(result: np.ndarray, masks: dict[str, np.ndarray]) -> None:
    for key, mask in masks.items():
        meta = CONDITION_META[key]
        contours, _hierarchy = cv.findContours(mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv.contourArea, reverse=True)[:8]
        for index, contour in enumerate(contours):
            area = cv.contourArea(contour)
            if area < 5:
                continue
            x, y, w, h = cv.boundingRect(contour)
            color = meta["bgr"]
            if key == "acne":
                radius = max(4, min(13, int(max(w, h) / 2) + 2))
                cv.circle(result, (x + w // 2, y + h // 2), radius, color, 2)
            elif key == "dark_spots":
                cv.rectangle(result, (x, y), (x + w, y + h), color, 2)
            elif key == "wrinkles":
                cv.drawContours(result, [contour], -1, color, 2)
            elif key == "redness":
                cv.ellipse(result, (x + w // 2, y + h // 2), (max(6, w // 2), max(5, h // 2)), 0, 0, 360, color, 2)
            elif key == "pores":
                cv.drawMarker(result, (x + w // 2, y + h // 2), color, markerType=cv.MARKER_CROSS, markerSize=12, thickness=1)

            if index < 2 and area >= 18:
                _put_label(result, meta["short"], (x, max(14, y - 4)), color, scale=0.38)


def _put_label(image: np.ndarray, text: str, origin: tuple[int, int], color: tuple[int, int, int], scale: float = 0.45) -> None:
    x, y = origin
    font = cv.FONT_HERSHEY_SIMPLEX
    thickness = 1
    (width, height), baseline = cv.getTextSize(text, font, scale, thickness)
    x = max(0, min(x, image.shape[1] - width - 6))
    y = max(height + 4, min(y, image.shape[0] - baseline - 4))
    cv.rectangle(image, (x, y - height - 5), (x + width + 6, y + baseline + 3), color, -1)
    cv.putText(image, text, (x + 3, y), font, scale, (255, 255, 255), thickness, cv.LINE_AA)


def _score_from_penalty(penalty: float) -> int:
    return int(max(0, min(100, round(100 - penalty))))


def _severity(score: int) -> str:
    if score >= 78:
        return "low"
    if score >= 55:
        return "moderate"
    return "high"
