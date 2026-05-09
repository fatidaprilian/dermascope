"""Safe API errors for ImgLab."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ApiError(Exception):
    code: str
    message: str
    status_code: int = 400
    details: dict[str, Any] | None = None

    def to_response(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "code": self.code,
            "message": self.message,
        }
        if self.details:
            payload["details"] = self.details
        return payload
