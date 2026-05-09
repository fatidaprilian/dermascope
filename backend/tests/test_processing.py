import unittest

import cv2 as cv
import numpy as np

from imglab_api.errors import ApiError
from imglab_api.processing import GOALS, goal_by_id, goal_payload, process_goal


def sample_png() -> bytes:
    image = np.zeros((24, 24, 3), dtype=np.uint8)
    image[6:18, 6:18] = (255, 255, 255)
    success, encoded = cv.imencode(".png", image)
    assert success
    return encoded.tobytes()


class ProcessingTests(unittest.TestCase):
    def test_goals_map_to_operations(self) -> None:
        payload = goal_payload()
        self.assertGreaterEqual(len(payload), 8)
        self.assertEqual(goal_by_id(GOALS[0].id).operation_id, GOALS[0].operation_id)

    def test_process_goal_returns_png(self) -> None:
        result = process_goal(sample_png(), "image/png", "make-clear", {"amount": 1.2})
        self.assertEqual(result.media_type, "image/png")
        self.assertGreater(len(result.data), 0)
        self.assertEqual(result.operation_id, "sharpen")

    def test_rejects_unknown_goal(self) -> None:
        with self.assertRaises(ApiError) as context:
            process_goal(sample_png(), "image/png", "not-a-goal", {})
        self.assertEqual(context.exception.code, "UNKNOWN_GOAL")

    def test_rejects_wrong_file_type(self) -> None:
        with self.assertRaises(ApiError) as context:
            process_goal(b"not an image", "text/plain", "make-clear", {})
        self.assertEqual(context.exception.code, "UNSUPPORTED_FILE_TYPE")


if __name__ == "__main__":
    unittest.main()
