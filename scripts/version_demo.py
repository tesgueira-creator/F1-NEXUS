"""Small demo to show usage of lib.version_utils.from_version_string"""
from lib.version_utils import from_version_string
from typing import List, Optional


def main() -> None:
    examples: List[Optional[str]] = [
        "v1.2.3",
        "2.0",
        "",
        None,
        "1.2.alpha",
        "3",
    ]
    for ex in examples:
        try:
            print(repr(ex), "->", from_version_string(ex))
        except Exception as e:
            print(repr(ex), "-> error:", e)


if __name__ == "__main__":
    main()
