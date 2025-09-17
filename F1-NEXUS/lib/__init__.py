"""lib package initializer.

Expose submodules to make imports like `from lib.version_utils import ...`
work reliably for both runtime and editor analysis.
"""

from . import version_utils  # re-export the module

__all__ = ["version_utils"]
