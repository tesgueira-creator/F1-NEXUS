import unittest  # Needed for unittest.TestCase subclasses and direct execution
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

    def test_negative_version_component(self) -> None:
        cases = [
            ("1.-2.3", "-2"),
            ("-1.2.3", "-1"),
            ("v-1.2", "-1"),
            ("v1.-2", "-2"),
            (" -1", "-1"),
        ]

        for raw_input, negative_component in cases:
            with self.subTest(raw_input=raw_input):
                with self.assertRaises(ValueError) as cm:
                    from_version_string(raw_input)
                expected_message = (
                    f"Negative version segment '{negative_component}' in "
                    f"'{raw_input.strip()}'"
                )
                self.assertEqual(str(cm.exception), expected_message)


if __name__ == "__main__":
    unittest.main()

