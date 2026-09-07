"""Shared signal types for pet image analysis."""

from dataclasses import dataclass, field
from typing import List


@dataclass
class ImageSignals:
    """Quantitative signals extracted from a pet photo."""

    skin_exposure_ratio: float = 0.0
    skin_irritation_score: float = 0.0
    coat_health_score: float = 1.0
    emaciation_score: float = 0.0
    image_quality_score: float = 1.0
    subject_coverage: float = 0.0
    brightness: float = 0.5
    blur_score: float = 1.0
    face_visible: bool = False
    warnings: List[str] = field(default_factory=list)
