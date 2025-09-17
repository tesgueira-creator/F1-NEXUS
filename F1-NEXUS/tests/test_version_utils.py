import unittest
from typing import Optional

from lib.version_utils import from_version_string


class TestVersionUtils(unittest.TestCase):
    def test_valid_versions(self) -> None:
        cases: list[tuple[Optional[str], tuple[int, int, int]]] = [
            ("1.2.3", (1, 2, 3)),
            ("v2.0", (2, 0, 0)),
            ("3", (3, 0, 0)),
            ("", (0, 0, 0)),
            (None, (0, 0, 0)),
        ]
        for inp, expected in cases:
            self.assertEqual(from_version_string(inp), expected)

    def test_invalid_version(self) -> None:
        with self.assertRaises(ValueError):
            from_version_string("1.2.alpha")


if __name__ == "__main__":
    unittest.main()

