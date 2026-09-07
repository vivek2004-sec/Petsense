import io

import numpy as np
from PIL import Image

from app.services.image_analyzer import analyze_pet_image


def _make_skin_disease_image() -> bytes:
    """Simulate a dog with extensive bare pink skin (mange-like)."""
    img = np.zeros((400, 300, 3), dtype=np.uint8)
    # Background — dirt/grass tones
    img[:, :] = [60, 90, 45]
    # Body region with mostly pink bare skin
    img[80:340, 60:240] = [210, 140, 130]
    # Patches of remaining tan fur on head
    img[80:160, 100:200] = [160, 110, 70]
    # Dark eyes/nose area
    img[110:130, 130:170] = [30, 25, 20]
    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="JPEG")
    return buf.getvalue()


def _make_healthy_dog_image() -> bytes:
    """Simulate a healthy brown dog on neutral background."""
    img = np.zeros((400, 300, 3), dtype=np.uint8)
    img[:, :] = [120, 120, 110]  # neutral background
    img[100:350, 80:220] = [140, 95, 55]  # brown fur body
    img[100:180, 110:190] = [150, 100, 60]  # head
    img[130:150, 130:170] = [25, 20, 15]  # face features
    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="JPEG")
    return buf.getvalue()


def test_skin_disease_detected_as_high_risk():
    result = analyze_pet_image(_make_skin_disease_image(), species="dog")
    assert result.pain_risk in ("Medium", "High")
    assert result.emotion_label == "anxious"
    assert result.signals.skin_exposure_ratio > 0.2
    assert len(result.advice) >= 2
    assert any("vet" in a.lower() or "mange" in a.lower() for a in result.advice)


def test_healthy_dog_low_pain_risk():
    result = analyze_pet_image(_make_healthy_dog_image(), species="dog")
    assert result.pain_risk == "Low"
    assert result.confidence >= 0.45
    assert result.analysis_mode == "cv_heuristic"


def test_invalid_bytes_returns_fallback():
    result = analyze_pet_image(b"not-an-image", species="dog")
    assert result.analysis_mode == "fallback"
    assert result.confidence < 0.5
