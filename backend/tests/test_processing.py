import unittest

import cv2 as cv
import numpy as np

from imglab_api.errors import ApiError
from imglab_api.processing import GOALS, goal_by_id, goal_payload, preprocess_face, process_goal


def sample_png() -> bytes:
    image = np.full((180, 140, 3), (120, 150, 190), dtype=np.uint8)
    cv.ellipse(image, (70, 86), (42, 58), 0, 0, 360, (135, 170, 215), -1)
    cv.circle(image, (56, 70), 3, (40, 55, 210), -1)
    cv.circle(image, (88, 88), 4, (50, 70, 160), -1)
    success, encoded = cv.imencode(".png", image)
    assert success
    return encoded.tobytes()


class ProcessingTests(unittest.TestCase):
    def test_goals_map_to_operations(self) -> None:
        payload = goal_payload()
        self.assertEqual(len(payload), 1)
        self.assertEqual(goal_by_id(GOALS[0].id).operation_id, GOALS[0].operation_id)

    def test_process_goal_returns_png(self) -> None:
        result = process_goal(sample_png(), "image/png", "skin-health-analysis", {})
        self.assertEqual(result.media_type, "image/png")
        self.assertGreater(len(result.data), 0)
        self.assertEqual(result.operation_id, "facial-skin-analysis")
        self.assertEqual(result.output_mode, "overlay")
        self.assertIsNotNone(result.analysis)
        assert result.analysis is not None
        self.assertIn("overallScore", result.analysis)
        self.assertEqual(len(result.analysis["categories"]), 5)

    def test_preprocess_face_returns_cropped_png(self) -> None:
        result = preprocess_face(sample_png(), "image/png")
        self.assertEqual(result.media_type, "image/png")
        self.assertEqual(result.operation_id, "face-preprocess")
        self.assertEqual(result.output_mode, "preprocess")
        self.assertGreater(len(result.data), 0)
        self.assertIsNotNone(result.analysis)
        assert result.analysis is not None
        self.assertIn("crop", result.analysis)

    def test_rejects_unknown_goal(self) -> None:
        with self.assertRaises(ApiError) as context:
            process_goal(sample_png(), "image/png", "not-a-goal", {})
        self.assertEqual(context.exception.code, "UNKNOWN_GOAL")

    def test_rejects_wrong_file_type(self) -> None:
        with self.assertRaises(ApiError) as context:
            process_goal(b"not an image", "text/plain", "skin-health-analysis", {})
        self.assertEqual(context.exception.code, "UNSUPPORTED_FILE_TYPE")

    def test_rejects_empty_file(self) -> None:
        with self.assertRaises(ApiError) as context:
            process_goal(b"", "image/png", "skin-health-analysis", {})
        self.assertEqual(context.exception.code, "EMPTY_FILE")

    def test_rejects_oversized_file_before_decode(self) -> None:
        oversized = b"0" * (10 * 1024 * 1024 + 1)
        with self.assertRaises(ApiError) as context:
            process_goal(oversized, "image/png", "skin-health-analysis", {})
        self.assertEqual(context.exception.code, "FILE_TOO_LARGE")


if __name__ == "__main__":
    unittest.main()
