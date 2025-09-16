"""Utility helpers for version string parsing.

This module provides a single helper `from_version_string` which
parses semantic version strings like "1.2.3" or "v1.2" into a
3-tuple of integers (major, minor, patch). It is defensive and
keeps behavior predictable for empty or malformed inputs.

The workspace previously had a stray token `_from_version_string` in an
untitled buffer; adding this module centralizes the helper for reuse.
"""
from __future__ import annotations

from typing import Tuple, Optional


def from_version_string(s: Optional[str]) -> Tuple[int, int, int]:
    """Parse a semantic version string into (major, minor, patch).

    Rules:
    - Accepts strings like '1.2.3', 'v1.2', '1.2', '1'
    - Leading 'v' is ignored ('v1.2.3' == '1.2.3')
    - Missing components default to 0 (eg. '1.2' -> (1,2,0))
    - Empty or None-like input returns (0,0,0)
    - Raises ValueError for inputs that contain non-integer or negative
      components (except a leading 'v').

    Examples:
        >>> from_version_string('v2.10.3')
        (2, 10, 3)
        >>> from_version_string('1.4')
        (1, 4, 0)
    """

    if s is None:
        return 0, 0, 0

    s = s.strip()
    if not s:
        return 0, 0, 0

    original_input = s

    if s.startswith("v") or s.startswith("V"):
        parsed = s[1:]
    else:
        parsed = s

    parts = parsed.split(".")
    nums: list[int] = []
    for p in parts:
        if p == "":
            # treat empty segment as 0 (defensive)
            nums.append(0)
            continue
        try:
            value = int(p)
        except ValueError as exc:
            msg = "Invalid version segment '{}' in '{}'".format(p, original_input)
            raise ValueError(msg) from exc

        if value < 0:
            msg = "Negative version segment '{}' in '{}'".format(p, original_input)
            raise ValueError(msg)

        nums.append(value)

    while len(nums) < 3:
        nums.append(0)

    return nums[0], nums[1], nums[2]
