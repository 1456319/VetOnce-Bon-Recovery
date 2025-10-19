# This file makes the 'jailbreaker' directory a Python package.
# It also makes key classes and functions available for easier import.

from .jailbreaker import BestOfNJailbreaker
from .model_apis import get_model_api
from .evaluators import get_evaluator_score, is_refusal

# Expose the main components when the package is imported
__all__ = [
    "BestOfNJailbreaker",
    "get_model_api",
    "get_evaluator_score",
    "is_refusal"
]
