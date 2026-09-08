"""
Computer-vision image analyzer for pet wellness screening.

Uses PIL + NumPy heuristics (no trained ONNX weights required) to estimate:
- coat / skin health signals (hair loss, irritation)
- image quality (blur, lighting, framing)
- distress and pain-risk indicators

Enhanced with:
- HSV color-space analysis for robust skin/fur discrimination
- Adaptive thresholds based on image brightness and contrast
- Texture analysis (LBP-inspired) for fur vs. bare skin
- Multi-zone body analysis for localized issue detection
- Better brown-fur exclusion to reduce false positives
- Sobel-based sharpness measurement
- Confidence calibration via sigmoid scaling
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from app.services.disease_assessor import HealthReport, assess_health, health_report_to_dict
from app.services.pet_signals import ImageSignals
import numpy as np
from PIL import Image, ImageFilter


@dataclass
class ImageAnalysis:
    """Full analysis output used by the inference service."""

    emotion_label: str
    confidence: float
    pain_risk: str
    visual_cues: List[str]
    pain_cues: List[str]
    explanation: str
    advice: List[str]
    signals: ImageSignals
    health_report: Optional[HealthReport] = None
    analysis_mode: str = "cv_heuristic"


# ── Core analyzer ─────────────────────────────────────────────────────────────


def analyze_pet_image(image_bytes: bytes, species: str = "dog") -> ImageAnalysis:
    """Analyze pet photo bytes and return structured wellness assessment."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return _fallback_analysis("Could not decode image. Please upload a JPG or PNG photo.")

    # Downscale for speed while keeping detail
    img = _resize(img, max_side=640)
    rgb = np.asarray(img, dtype=np.float32) / 255.0
    h, w = rgb.shape[:2]

    signals = ImageSignals()

    # ── Basic quality signals ──────────────────────────────────────────────
    signals.brightness = float(np.mean(rgb))
    signals.contrast = float(np.std(rgb))
    signals.blur_score = _blur_score_sobel(img)
    signals.subject_coverage = _subject_coverage(rgb)

    # ── Skin metrics (RGB + HSV combined) ──────────────────────────────────
    rgb_skin_ratio, irritation = _skin_metrics_enhanced(rgb, signals.brightness, signals.contrast)
    hsv_skin_ratio = _hsv_skin_analysis(img, species)

    # Combine RGB and HSV skin ratios — require agreement for high confidence
    signals.skin_exposure_ratio = _concordant_skin_ratio(rgb_skin_ratio, hsv_skin_ratio)
    signals.hsv_skin_ratio = hsv_skin_ratio
    signals.skin_irritation_score = irritation

    signals.coat_health_score = max(0.0, 1.0 - signals.skin_exposure_ratio * 1.15)
    signals.emaciation_score = _emaciation_score(rgb)
    signals.face_visible = _face_visible_multiregion(rgb)
    signals.texture_score = _texture_score(img)
    signals.color_variance = _color_variance(rgb)
    signals.red_channel_dominance = _red_channel_dominance(rgb)
    signals.symmetry_score = _symmetry_score(rgb)
    signals.zone_scores = _multi_zone_analysis(rgb, signals.brightness, signals.contrast)

    signals.image_quality_score = _quality_score(signals)
    signals.warnings = _quality_warnings(signals)

    return _infer_from_signals(signals, species)


# ── Signal extraction ─────────────────────────────────────────────────────────


def _resize(img: Image.Image, max_side: int) -> Image.Image:
    w, h = img.size
    scale = max_side / max(w, h)
    if scale >= 1.0:
        return img
    return img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)


def _blur_score_sobel(img: Image.Image) -> float:
    """Sobel gradient magnitude — more robust sharpness measurement than Laplacian variance."""
    gray = np.asarray(img.convert("L"), dtype=np.float32)

    # Sobel X
    sx = (
        -1 * gray[:-2, :-2] + 1 * gray[:-2, 2:]
        + -2 * gray[1:-1, :-2] + 2 * gray[1:-1, 2:]
        + -1 * gray[2:, :-2] + 1 * gray[2:, 2:]
    )
    # Sobel Y
    sy = (
        -1 * gray[:-2, :-2] + -2 * gray[:-2, 1:-1] + -1 * gray[:-2, 2:]
        + 1 * gray[2:, :-2] + 2 * gray[2:, 1:-1] + 1 * gray[2:, 2:]
    )

    magnitude = np.sqrt(sx ** 2 + sy ** 2)
    mean_grad = float(np.mean(magnitude))
    # Normalize to 0–1 (typical phone photo gradient range)
    return float(np.clip(mean_grad / 50.0, 0.0, 1.0))


def _subject_coverage(rgb: np.ndarray) -> float:
    """Estimate how much of the frame contains the pet (non-background)."""
    h, w = rgb.shape[:2]
    # Center-weighted region — pets are usually centered
    cy, cx = h // 2, w // 2
    y0, y1 = max(0, cy - h // 3), min(h, cy + h // 3)
    x0, x1 = max(0, cx - w // 3), min(w, cx + w // 3)
    center = rgb[y0:y1, x0:x1]

    # Background = green grass or very dark soil
    r, g, b = center[..., 0], center[..., 1], center[..., 2]
    green_bg = (g > r + 0.05) & (g > b + 0.05) & (g > 0.25)
    dark_bg = (r + g + b) < 0.35
    bg_mask = green_bg | dark_bg

    pet_pixels = float(np.sum(~bg_mask))
    total = float(bg_mask.size) or 1.0
    center_ratio = pet_pixels / total

    # Also check full frame non-background ratio
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green_bg = (g > r + 0.05) & (g > b + 0.05) & (g > 0.25)
    dark_bg = (r + g + b) < 0.30
    full_ratio = float(np.sum(~(green_bg | dark_bg))) / float(rgb.shape[0] * rgb.shape[1])

    return float(np.clip(max(center_ratio, full_ratio * 0.85), 0.0, 1.0))


def _hsv_skin_analysis(img: Image.Image, species: str) -> float:
    """
    HSV-based skin detection — separates hue from brightness for more robust
    skin/fur discrimination. Brown fur (hue 10–40°) is excluded from skin detection.
    """
    rgb_arr = np.asarray(img, dtype=np.float32) / 255.0
    h_img, w_img = rgb_arr.shape[:2]

    # Crop margins to focus on pet body
    margin_y, margin_x = int(h_img * 0.08), int(w_img * 0.08)
    body = rgb_arr[margin_y:h_img - margin_y, margin_x:w_img - margin_x]
    if body.size == 0:
        return 0.0

    r, g, b = body[..., 0], body[..., 1], body[..., 2]

    # Manual RGB→HSV conversion for the hue channel
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin + 1e-8

    # Hue calculation (0–360 range)
    hue = np.zeros_like(r)
    mask_r = cmax == r
    mask_g = (cmax == g) & ~mask_r
    mask_b = ~mask_r & ~mask_g
    hue[mask_r] = 60 * (((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6)
    hue[mask_g] = 60 * (((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2)
    hue[mask_b] = 60 * (((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4)

    saturation = np.where(cmax > 0, delta / (cmax + 1e-8), 0)
    value = cmax

    # Pink/salmon skin: hue 320–360 or 0–15, moderate saturation, bright
    skin_hue_mask = ((hue >= 320) | (hue <= 15)) & (saturation > 0.10) & (saturation < 0.75) & (value > 0.40)

    # Red inflammation: hue 0–20, high saturation, bright
    inflamed_mask = (hue <= 20) & (saturation > 0.40) & (value > 0.45) & (r > 0.50) & (r - g > 0.18)

    # Brown fur exclusion zone: hue 15–45, moderate saturation — this is fur, not skin
    brown_fur = (hue >= 15) & (hue <= 45) & (saturation > 0.15) & (saturation < 0.70) & (value > 0.20)

    # Golden/tan fur exclusion: hue 30–55
    golden_fur = (hue >= 30) & (hue <= 55) & (saturation > 0.15) & (value > 0.35)

    # Background exclusion
    bg_green = (hue >= 70) & (hue <= 170) & (saturation > 0.15)
    bg_very_dark = value < 0.12
    bg_very_bright = (value > 0.92) & (saturation < 0.08)

    valid_pixels = ~(bg_green | bg_very_dark | bg_very_bright | brown_fur | golden_fur)
    skin_mask = (skin_hue_mask | inflamed_mask) & valid_pixels

    valid_count = float(np.sum(valid_pixels)) or 1.0
    return float(np.clip(np.sum(skin_mask) / valid_count, 0.0, 1.0))


def _concordant_skin_ratio(rgb_ratio: float, hsv_ratio: float) -> float:
    """
    Combine RGB and HSV skin ratios with concordance weighting.
    When both methods agree, confidence is high. When they disagree, the lower
    estimate is weighted more to reduce false positives.
    """
    if rgb_ratio < 0.05 and hsv_ratio < 0.05:
        return 0.0

    agreement = 1.0 - abs(rgb_ratio - hsv_ratio)
    # When methods agree (agreement > 0.7), use the average
    if agreement > 0.7:
        return (rgb_ratio + hsv_ratio) / 2.0
    # When methods disagree, lean toward the lower (conservative) estimate
    return min(rgb_ratio, hsv_ratio) * 0.7 + max(rgb_ratio, hsv_ratio) * 0.3


def _skin_metrics_enhanced(rgb: np.ndarray, brightness: float, contrast: float) -> Tuple[float, float]:
    """
    Enhanced skin detection with adaptive thresholds based on image brightness/contrast.
    Returns (skin_exposure_ratio, irritation_score).
    """
    h, w = rgb.shape[:2]
    margin_y, margin_x = int(h * 0.08), int(w * 0.08)
    body = rgb[margin_y:h - margin_y, margin_x:w - margin_x]
    if body.size == 0:
        return 0.0, 0.0

    r, g, b = body[..., 0], body[..., 1], body[..., 2]

    # ── Adaptive thresholds based on image conditions ──────────────────────
    # Dark images need lower thresholds; bright images need higher
    bright_offset = (brightness - 0.5) * 0.12
    contrast_factor = max(0.5, min(1.5, contrast * 3.0))

    pink_r_thresh = max(0.38, 0.48 + bright_offset)
    pink_g_min = max(0.15, 0.22 + bright_offset * 0.5)
    pink_brightness_thresh = max(0.32, 0.42 + bright_offset)

    pixel_brightness = (r + g + b) / 3.0
    pink_skin = (
        (r > pink_r_thresh)
        & (r > g + 0.10 * contrast_factor)
        & (r > b + 0.08 * contrast_factor)
        & (g > pink_g_min)
        & (g < r - 0.06)
        & (pixel_brightness > pink_brightness_thresh)
    )

    # Strong red inflammation (not brown fur)
    red_irritated = (r > 0.55) & (g < 0.35) & (b < 0.30) & (r - g > 0.20 * contrast_factor)

    # ── Enhanced brown fur exclusion ──────────────────────────────────────
    # Brown, tan, golden, chocolate tones — very common in dogs
    brown_fur = (
        (r > 0.20) & (r < 0.80)
        & (g > 0.12) & (g < r)
        & (b < g)
        & (r - g < 0.25)  # Tighter than before — brown fur has low R-G difference
        & (r - g > 0.02)  # But some difference
    )

    # Black fur
    black_fur = (r + g + b) < 0.35
    # White fur
    white_fur = (r + g + b) > 2.2

    healthy_fur = brown_fur | black_fur | white_fur

    # Exclude obvious background from denominator
    green_bg = (g > r + 0.05) & (g > b + 0.05)
    valid = ~green_bg

    skin_mask = (pink_skin | red_irritated) & valid & ~healthy_fur
    fur_mask = healthy_fur & valid

    valid_count = float(np.sum(valid)) or 1.0
    skin_ratio = float(np.sum(skin_mask)) / valid_count
    fur_ratio = float(np.sum(fur_mask)) / valid_count

    # Normalize exposure relative to visible pet area
    pet_area = skin_ratio + fur_ratio
    if pet_area > 0.05:
        exposure = skin_ratio / pet_area
    else:
        exposure = skin_ratio

    # Irritation intensity from red channel excess in skin regions
    if np.any(skin_mask):
        skin_pixels = body[skin_mask]
        irritation = float(np.mean(skin_pixels[..., 0] - skin_pixels[..., 1]))
        irritation = float(np.clip(irritation * 2.5, 0.0, 1.0))
    else:
        irritation = 0.0

    return float(np.clip(exposure, 0.0, 1.0)), irritation


def _texture_score(img: Image.Image) -> float:
    """
    LBP-inspired texture analysis. Healthy fur has high micro-texture (individual hairs).
    Bare skin, lesions, and smooth patches have lower texture scores.
    """
    gray = np.asarray(img.convert("L"), dtype=np.float32)
    h, w = gray.shape

    # Focus on central body area
    body = gray[int(h * 0.15):int(h * 0.85), int(w * 0.15):int(w * 0.85)]
    if body.size < 100:
        return 0.5

    # Compute local texture via standard deviation in small windows
    # Using a sliding approach with shifted arrays
    texture_map = np.zeros_like(body[1:-1, 1:-1])
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            if dy == 0 and dx == 0:
                continue
            shifted = body[1 + dy:body.shape[0] - 1 + dy, 1 + dx:body.shape[1] - 1 + dx]
            texture_map += np.abs(body[1:-1, 1:-1] - shifted)

    mean_texture = float(np.mean(texture_map)) / 8.0  # Normalize by number of neighbors
    # Higher texture = more fur-like; normalize to 0–1
    return float(np.clip(mean_texture / 20.0, 0.0, 1.0))


def _color_variance(rgb: np.ndarray) -> float:
    """
    Measure color variance across the pet's body. Healthy coats are relatively uniform.
    Patchy conditions (mange, ringworm) create high color variance.
    """
    h, w = rgb.shape[:2]
    body = rgb[int(h * 0.1):int(h * 0.9), int(w * 0.1):int(w * 0.9)]
    if body.size < 100:
        return 0.0

    # Compute per-channel variance and average
    var_r = float(np.var(body[..., 0]))
    var_g = float(np.var(body[..., 1]))
    var_b = float(np.var(body[..., 2]))
    mean_var = (var_r + var_g + var_b) / 3.0

    return float(np.clip(mean_var * 10.0, 0.0, 1.0))


def _red_channel_dominance(rgb: np.ndarray) -> float:
    """
    Measure how much the red channel dominates over green/blue across the body.
    Elevated in inflamed or irritated skin areas.
    """
    h, w = rgb.shape[:2]
    body = rgb[int(h * 0.1):int(h * 0.9), int(w * 0.1):int(w * 0.9)]
    if body.size < 100:
        return 0.0

    r, g, b = body[..., 0], body[..., 1], body[..., 2]
    dominance = r - (g + b) / 2.0
    mean_dom = float(np.mean(np.clip(dominance, 0, None)))
    return float(np.clip(mean_dom * 5.0, 0.0, 1.0))


def _symmetry_score(rgb: np.ndarray) -> float:
    """
    Measure left-right color symmetry. Healthy pets tend to be symmetric.
    Localized disease creates asymmetry.
    """
    h, w = rgb.shape[:2]
    if w < 4:
        return 0.5

    mid = w // 2
    left = rgb[:, :mid]
    right = np.flip(rgb[:, max(0, w - mid):], axis=1)

    # Ensure same size
    min_w = min(left.shape[1], right.shape[1])
    left = left[:, :min_w]
    right = right[:, :min_w]

    diff = np.mean(np.abs(left - right))
    # Low diff = high symmetry (return inverted)
    return float(np.clip(1.0 - diff * 5.0, 0.0, 1.0))


def _multi_zone_analysis(rgb: np.ndarray, brightness: float, contrast: float) -> List[float]:
    """
    Split image into 4 quadrants and compute a concern score for each.
    Returns [top-left, top-right, bottom-left, bottom-right] scores.
    """
    h, w = rgb.shape[:2]
    mid_h, mid_w = h // 2, w // 2

    zones = [
        rgb[:mid_h, :mid_w],    # top-left
        rgb[:mid_h, mid_w:],    # top-right
        rgb[mid_h:, :mid_w],    # bottom-left
        rgb[mid_h:, mid_w:],    # bottom-right
    ]

    scores = []
    for zone in zones:
        if zone.size < 50:
            scores.append(0.0)
            continue

        r, g, b = zone[..., 0], zone[..., 1], zone[..., 2]
        # Check for red/pink skin pixels in this zone
        pink = (r > 0.48) & (r > g + 0.10) & (r > b + 0.08) & ((r + g + b) / 3.0 > 0.42)
        # Exclude brown fur
        brown = (r > 0.20) & (r < 0.80) & (g > 0.12) & (g < r) & (r - g < 0.25)
        concern = pink & ~brown

        ratio = float(np.sum(concern)) / float(concern.size) if concern.size > 0 else 0.0
        scores.append(float(np.clip(ratio, 0.0, 1.0)))

    return scores


def _emaciation_score(rgb: np.ndarray) -> float:
    """
    Hint at underweight body condition via horizontal edge patterns (ribs)
    and low body mass in the central silhouette.
    """
    gray = np.mean(rgb, axis=2)
    h, w = gray.shape
    torso = gray[int(h * 0.25):int(h * 0.75), int(w * 0.15):int(w * 0.85)]
    if torso.size == 0:
        return 0.0

    # Horizontal gradients suggest rib lines on thin animals
    h_diff = np.abs(torso[:, 2:] - torso[:, :-2])
    h_edge_density = float(np.mean(h_diff > 0.06))

    mid_range = (torso > 0.15) & (torso < 0.92)
    torso_fill = float(np.mean(mid_range))
    thinness = 1.0 - float(np.clip(np.std(torso) * 4.0, 0.0, 1.0))

    score = h_edge_density * 0.45 + thinness * 0.35 + (1.0 - torso_fill) * 0.20
    return float(np.clip(score, 0.0, 1.0))


def _face_visible_multiregion(rgb: np.ndarray) -> bool:
    """
    Enhanced face detection: scan multiple regions to handle both horizontal
    and vertical pet orientations, not just upper-center.
    """
    h, w = rgb.shape[:2]

    # Candidate face regions
    regions = [
        # Upper center (pet facing camera)
        rgb[int(h * 0.05):int(h * 0.45), int(w * 0.25):int(w * 0.75)],
        # Left third (pet in profile, facing left)
        rgb[int(h * 0.10):int(h * 0.60), int(w * 0.0):int(w * 0.35)],
        # Right third (pet in profile, facing right)
        rgb[int(h * 0.10):int(h * 0.60), int(w * 0.65):int(w * 1.0)],
        # Center (close-up face shot)
        rgb[int(h * 0.15):int(h * 0.65), int(w * 0.20):int(w * 0.80)],
    ]

    for region in regions:
        if region.size == 0:
            continue
        darkness = np.mean(region, axis=2)
        dark_fraction = float(np.sum(darkness < 0.35)) / float(darkness.size)
        # Dark spots (eyes, nose) should be present in a face
        if dark_fraction > 0.04:
            return True

    return False


def _quality_score(signals: ImageSignals) -> float:
    score = 1.0
    score *= 0.5 + 0.5 * signals.blur_score
    if signals.brightness < 0.15 or signals.brightness > 0.92:
        score *= 0.6
    if signals.subject_coverage < 0.2:
        score *= 0.5
    # Bonus for good contrast
    if signals.contrast > 0.15:
        score *= 1.05
    return float(np.clip(score, 0.0, 1.0))


def _quality_warnings(signals: ImageSignals) -> List[str]:
    warnings = []
    if signals.blur_score < 0.25:
        warnings.append("Photo appears blurry — retake with a steady hand.")
    if signals.brightness < 0.15:
        warnings.append("Image is too dark — use better lighting.")
    if signals.brightness > 0.92:
        warnings.append("Image is overexposed — avoid direct harsh sunlight.")
    if signals.subject_coverage < 0.25:
        warnings.append("Pet may be too far away — move closer for a clearer scan.")
    if signals.contrast < 0.08:
        warnings.append("Image has very low contrast — results may be less reliable.")
    return warnings


# ── Confidence calibration ────────────────────────────────────────────────────


def _calibrate_confidence(raw_conf: float, signals: ImageSignals) -> float:
    """
    Post-hoc sigmoid calibration so reported confidence better reflects
    actual prediction reliability. Adjusts based on image quality.
    """
    # Sigmoid centering — shift raw confidence to be more conservative
    centered = (raw_conf - 0.5) * 2.5  # Scale to roughly -1.25 to +1.25
    calibrated = 1.0 / (1.0 + np.exp(-centered))

    # Quality penalty — lower confidence for poor-quality images
    quality_factor = 0.7 + 0.3 * signals.image_quality_score

    result = calibrated * quality_factor
    return float(np.clip(result, 0.30, 0.96))


# ── Inference + advice ────────────────────────────────────────────────────────


def _infer_from_signals(signals: ImageSignals, species: str) -> ImageAnalysis:
    visual_cues: List[str] = []
    pain_cues: List[str] = []
    advice: List[str] = []

    # ── Health-critical signals (street dog / mange cases) ─────────────────
    # Enhanced: use concordance of multiple signals for more reliable scoring
    concordance_count = sum([
        signals.skin_exposure_ratio > 0.20,
        signals.hsv_skin_ratio > 0.15,
        signals.skin_irritation_score > 0.20,
        signals.texture_score < 0.30,  # Low texture = bare skin
        signals.red_channel_dominance > 0.15,
        signals.color_variance > 0.35,  # Patchy appearance
        max(signals.zone_scores) > 0.15,  # Localized concern
    ])

    health_severity = (
        signals.skin_exposure_ratio * 0.30
        + signals.hsv_skin_ratio * 0.15
        + signals.skin_irritation_score * 0.25
        + signals.emaciation_score * 0.20
        + (1.0 - signals.texture_score) * 0.10
    )

    # Boost severity when multiple independent signals agree
    if concordance_count >= 4:
        health_severity = min(1.0, health_severity * 1.25)
    elif concordance_count <= 1:
        health_severity *= 0.65  # Likely a false positive — dampen

    if signals.skin_exposure_ratio > 0.28:
        visual_cues.append("significant hair loss / bare skin visible")
        pain_cues.append("possible skin disease (mange, dermatitis, or infection)")
        advice.append(
            "Hair loss with exposed skin often indicates mange, fungal infection, or severe "
            "allergies. This is treatable — contact a veterinarian or local animal rescue for "
            "medication and care."
        )

    if signals.skin_irritation_score > 0.35:
        visual_cues.append("skin redness or inflammation detected")
        pain_cues.append("irritated or lesion-covered skin")
        advice.append(
            "Red, inflamed skin can cause pain and itching. Avoid home remedies on open skin; "
            "a vet should examine the animal and prescribe appropriate treatment."
        )

    if signals.emaciation_score > 0.45:
        visual_cues.append("underweight body condition suggested")
        pain_cues.append("visible rib or hip structure")
        advice.append(
            "The animal appears underweight. Provide clean water and nutritious food, and "
            "arrange a vet visit for a full health assessment and deworming if needed."
        )

    # Texture-based cues
    if signals.texture_score < 0.20 and signals.skin_exposure_ratio > 0.15:
        visual_cues.append("smooth/bare skin texture detected (low fur density)")

    # Symmetry-based cues
    if signals.symmetry_score < 0.35 and signals.skin_exposure_ratio > 0.10:
        visual_cues.append("asymmetric coat pattern — possible localized condition")

    if signals.skin_exposure_ratio > 0.50 or (
        signals.skin_exposure_ratio > 0.35 and signals.skin_irritation_score > 0.30
    ):
        pain_risk = "High"
        emotion = "anxious"
        confidence = min(0.94, 0.68 + health_severity * 0.30)
        explanation = (
            "Our analysis detected serious wellness concerns in this photo — including signs "
            "consistent with skin disease, malnutrition, or significant discomfort. "
            "This animal likely needs professional veterinary attention."
        )
        advice.insert(
            0,
            "URGENT: This appears to be a medical situation, not just a mood reading. "
            "Contact a veterinarian or animal welfare organization as soon as possible.",
        )
    elif health_severity > 0.55:
        pain_risk = "High"
        emotion = "anxious"
        confidence = min(0.92, 0.62 + health_severity * 0.35)
        explanation = (
            "Our analysis detected serious wellness concerns in this photo — including signs "
            "consistent with skin disease, malnutrition, or significant discomfort. "
            "This animal likely needs professional veterinary attention."
        )
        advice.insert(
            0,
            "URGENT: This appears to be a medical situation, not just a mood reading. "
            "Contact a veterinarian or animal welfare organization as soon as possible.",
        )
    elif health_severity > 0.30:
        pain_risk = "Medium"
        emotion = "anxious"
        confidence = 0.58 + health_severity * 0.25
        explanation = (
            "Some visual indicators suggest your pet may be experiencing discomfort — "
            "possibly related to skin condition, weight loss, or stress. Monitor closely "
            "and consider a vet check-up."
        )
        advice.append(
            "Schedule a veterinary appointment within the next few days if symptoms persist "
            "or worsen."
        )
    else:
        # ── Emotional state heuristics for healthier-looking pets ────────────
        pain_risk = "Low"
        if signals.face_visible and signals.coat_health_score > 0.65:
            if signals.brightness > 0.4 and signals.image_quality_score > 0.6:
                emotion = "relaxed" if signals.brightness < 0.75 else "happy"
            else:
                emotion = "alert"
        elif signals.coat_health_score > 0.5:
            emotion = "neutral"
        else:
            emotion = "anxious"

        confidence = 0.50 + signals.image_quality_score * 0.30 + signals.coat_health_score * 0.12
        confidence = float(np.clip(confidence, 0.45, 0.88))

        explanations = {
            "happy": "Your pet's coat and posture in this photo suggest they are comfortable and content.",
            "relaxed": "Visual cues indicate a calm, relaxed state with no major health concerns detected.",
            "alert": "Your pet appears attentive. Ears and gaze suggest they are aware of their surroundings.",
            "neutral": "No strong emotional or health signals detected. Your pet appears generally stable.",
            "anxious": "Some subtle stress indicators were noted. Monitor for changes in eating or behavior.",
        }
        explanation = explanations.get(emotion, explanations["neutral"])

        if signals.coat_health_score > 0.7:
            visual_cues.append("coat appears generally healthy")
        if signals.face_visible:
            visual_cues.append("face visible toward camera")
        if signals.texture_score > 0.40:
            visual_cues.append("healthy fur texture detected")

    # Calibrate confidence
    confidence = _calibrate_confidence(confidence, signals)

    # Species-specific care tips
    advice.extend(_species_advice(species, emotion, pain_risk))

    # Image quality tips (always helpful)
    advice.extend(signals.warnings)

    # General disclaimer-style guidance
    if pain_risk == "Low" and health_severity < 0.2:
        advice.append(
            "For best results, photograph your pet in good lighting with their face and body "
            "clearly visible. Regular check-ups help catch issues early."
        )

    if not visual_cues:
        visual_cues = ["limited visual cues — try a closer, well-lit photo"]

    health_report = assess_health(signals, species)

    # Enrich advice from top disease finding
    if health_report.possible_diseases and health_report.possible_diseases[0].name != "No Significant Disease Detected":
        top = health_report.possible_diseases[0]
        advice.insert(0, f"Possible condition: {top.name} ({top.likelihood}). {top.summary}")
        if health_report.urgent_action:
            advice.insert(1, health_report.urgent_action)

    return ImageAnalysis(
        emotion_label=emotion,
        confidence=round(confidence, 3),
        pain_risk=pain_risk,
        visual_cues=visual_cues[:6],
        pain_cues=pain_cues[:5],
        explanation=explanation,
        advice=advice[:10],
        signals=signals,
        health_report=health_report,
    )


def _species_advice(species: str, emotion: str, pain_risk: str) -> List[str]:
    tips = []
    if species == "dog":
        if pain_risk == "Low" and emotion in ("happy", "relaxed"):
            tips.append("Daily walks, fresh water, and regular grooming help keep dogs healthy and happy.")
        if pain_risk != "Low":
            tips.append(
                "For street or rescue dogs: contact a local NGO — many offer free rabies vaccines, "
                "mange treatment, and sterilization programs."
            )
    else:
        if pain_risk == "Low":
            tips.append("Cats hide illness well — watch for changes in appetite, grooming, or litter box habits.")
    return tips


def _fallback_analysis(reason: str) -> ImageAnalysis:
    return ImageAnalysis(
        emotion_label="neutral",
        confidence=0.35,
        pain_risk="Low",
        visual_cues=["analysis unavailable"],
        pain_cues=[],
        explanation=reason,
        advice=["Upload a clear JPG or PNG photo with the pet centered in the frame."],
        signals=ImageSignals(image_quality_score=0.0, warnings=[reason]),
        health_report=HealthReport(
            overall_assessment="Could not analyze image — please upload a valid photo.",
            urgent_action="Retry with a clear, well-lit photo of the pet.",
        ),
        analysis_mode="fallback",
    )


def signals_to_dict(signals: ImageSignals) -> dict:
    return {
        "skin_exposure_ratio": round(signals.skin_exposure_ratio, 3),
        "skin_irritation_score": round(signals.skin_irritation_score, 3),
        "coat_health_score": round(signals.coat_health_score, 3),
        "emaciation_score": round(signals.emaciation_score, 3),
        "image_quality_score": round(signals.image_quality_score, 3),
        "subject_coverage": round(signals.subject_coverage, 3),
        "brightness": round(signals.brightness, 3),
        "blur_score": round(signals.blur_score, 3),
        "face_visible": signals.face_visible,
        "hsv_skin_ratio": round(signals.hsv_skin_ratio, 3),
        "color_variance": round(signals.color_variance, 3),
        "texture_score": round(signals.texture_score, 3),
        "symmetry_score": round(signals.symmetry_score, 3),
        "red_channel_dominance": round(signals.red_channel_dominance, 3),
        "contrast": round(signals.contrast, 3),
    }
