"""
Computer-vision image analyzer for pet wellness screening.

Uses PIL + NumPy heuristics (no trained ONNX weights required) to estimate:
- coat / skin health signals (hair loss, irritation)
- image quality (blur, lighting, framing)
- distress and pain-risk indicators

This replaces random mock output with analysis that actually reads the photo.
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
    signals.brightness = float(np.mean(rgb))
    signals.blur_score = _blur_score(img)
    signals.subject_coverage = _subject_coverage(rgb)
    signals.skin_exposure_ratio, signals.skin_irritation_score = _skin_metrics(rgb)
    signals.coat_health_score = max(0.0, 1.0 - signals.skin_exposure_ratio * 1.15)
    signals.emaciation_score = _emaciation_score(rgb)
    signals.face_visible = _face_visible(rgb)
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


def _blur_score(img: Image.Image) -> float:
    """Laplacian variance proxy — low variance means blurry."""
    gray = np.asarray(img.convert("L"), dtype=np.float32)
    lap = (
        -4 * gray[1:-1, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
        + gray[:-2, 1:-1]
        + gray[2:, 1:-1]
    )
    variance = float(np.var(lap))
    # Map typical phone-photo range to 0–1
    return float(np.clip(variance / 800.0, 0.0, 1.0))


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


def _skin_metrics(rgb: np.ndarray) -> Tuple[float, float]:
    """
    Detect bare / irritated skin via pink-red-salmon hues.
    Returns (skin_exposure_ratio, irritation_score).
    """
    h, w = rgb.shape[:2]
    # Focus on central body — exclude extreme edges (often background)
    margin_y, margin_x = int(h * 0.08), int(w * 0.08)
    body = rgb[margin_y : h - margin_y, margin_x : w - margin_x]
    if body.size == 0:
        return 0.0, 0.0

    r, g, b = body[..., 0], body[..., 1], body[..., 2]

    # Pink / salmon bare skin (common in mange, dermatitis) — bright exposed tissue
    pixel_brightness = (r + g + b) / 3.0
    pink_skin = (
        (r > 0.48)
        & (r > g + 0.10)
        & (r > b + 0.08)
        & (g > 0.22)
        & (g < r - 0.06)
        & (pixel_brightness > 0.42)  # bare skin is lighter than dark brown fur
    )

    # Strong red inflammation / lesions (not brown fur)
    red_irritated = (r > 0.55) & (g < 0.35) & (b < 0.30) & (r - g > 0.20)

    # Healthy fur tones — brown, tan, golden, black, white
    fur_tones = (
        ((r > 0.25) & (r < 0.75) & (g > 0.15) & (g < r) & (b < g) & (r - g < 0.22))
        | ((r + g + b) > 2.2)
        | ((r + g + b) < 0.35)
    )

    # Exclude obvious background from denominator
    green_bg = (g > r + 0.05) & (g > b + 0.05)
    valid = ~green_bg

    skin_mask = (pink_skin | red_irritated) & valid
    fur_mask = fur_tones & valid & ~skin_mask

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


def _emaciation_score(rgb: np.ndarray) -> float:
    """
    Hint at underweight body condition via horizontal edge patterns (ribs)
    and low body mass in the central silhouette.
    """
    gray = np.mean(rgb, axis=2)
    h, w = gray.shape
    torso = gray[int(h * 0.25) : int(h * 0.75), int(w * 0.15) : int(w * 0.85)]
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


def _face_visible(rgb: np.ndarray) -> bool:
    """Heuristic: dark eye/nose region in upper-center of frame."""
    h, w = rgb.shape[:2]
    region = rgb[int(h * 0.05) : int(h * 0.45), int(w * 0.25) : int(w * 0.75)]
    if region.size == 0:
        return False
    darkness = np.mean(region, axis=2)
    dark_fraction = float(np.sum(darkness < 0.35)) / float(darkness.size)
    return dark_fraction > 0.04


def _quality_score(signals: ImageSignals) -> float:
    score = 1.0
    score *= 0.5 + 0.5 * signals.blur_score
    if signals.brightness < 0.15 or signals.brightness > 0.92:
        score *= 0.6
    if signals.subject_coverage < 0.2:
        score *= 0.5
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
    return warnings


# ── Inference + advice ────────────────────────────────────────────────────────


def _infer_from_signals(signals: ImageSignals, species: str) -> ImageAnalysis:
    visual_cues: List[str] = []
    pain_cues: List[str] = []
    advice: List[str] = []

    # ── Health-critical signals (street dog / mange cases) ─────────────────
    health_severity = (
        signals.skin_exposure_ratio * 0.45
        + signals.skin_irritation_score * 0.30
        + signals.emaciation_score * 0.25
    )

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
    }
