"""Safe demo for from_version_string with a local fallback for editors.

Run this from the repository root. It will prefer the project helper but
falls back to a minimal local implementation if the package import fails.
"""
from typing import Optional, Tuple


try:
    from lib.version_utils import from_version_string  # type: ignore
except Exception:
    # Fallback implementation for environments where `lib` isn't importable
    def from_version_string(s: Optional[str]) -> Tuple[int, int, int]:
        if s is None:
            return 0, 0, 0
        s2 = s.strip().lstrip("vV")
        parts = s2.split(".") if s2 else []
        try:
            nums = [int(p) for p in parts if p != ""]
        except ValueError:
            raise ValueError("invalid version")
        while len(nums) < 3:
            nums.append(0)
        return nums[0], nums[1], nums[2]


def main() -> None:
    examples: list[Optional[str]] = ["v1.2.3", "2.0", "", None, "1.2.alpha"]
    for ex in examples:
        try:
            print(repr(ex), "->", from_version_string(ex))
        except Exception as e:
            print(repr(ex), "-> error:", e)


if __name__ == "__main__":
    main()
