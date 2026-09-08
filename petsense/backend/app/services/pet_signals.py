"""Shared signal types for pet image analysis."""

from dataclasses import dataclass, field
from typing import List


@dataclass
class ImageSignals:
    """Quantitative signals extracted from a pet photo."""

    # ── Original signals ──────────────────────────────────────────────────
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

    # ── New accuracy-improving signals ────────────────────────────────────
    # HSV-based skin ratio (more robust than RGB-only)
    hsv_skin_ratio: float = 0.0
    # Color variance — high variance across body indicates patchy conditions
    color_variance: float = 0.0
    # Texture score — fur has high texture, bare skin has low texture
    texture_score: float = 0.5
    # Symmetry — healthy pets tend to have symmetric coat patterns
    symmetry_score: float = 0.5
    # Red channel dominance — elevated in inflamed/irritated skin
    red_channel_dominance: float = 0.0
    # Contrast — helps with adaptive threshold calibration
    contrast: float = 0.5
    # Multi-zone flags — which body zones show concern
    zone_scores: List[float] = field(default_factory=lambda: [0.0, 0.0, 0.0, 0.0])
