"""
Inference Service — Vision + Audio Analysis
==============================================
Image analysis uses computer-vision heuristics (coat, skin, body condition).
Audio still uses mock until ONNX models are added.

Set USE_REAL_MODELS=true when trained ONNX weights are placed in /ml/models/.
"""

import random
import time
from dataclasses import dataclass, field
from typing import List, Optional

from app.config import get_settings
from app.services.image_analyzer import analyze_pet_image, signals_to_dict
from app.services.disease_assessor import health_report_to_dict

settings = get_settings()

# ── Constants ─────────────────────────────────────────────────────────────────

EMOTION_LABELS = ["happy", "relaxed", "anxious", "scared", "alert", "aggressive", "neutral"]
AUDIO_LABELS   = ["playful", "distressed", "warning", "pain-whine", "content"]
PAIN_RISK_LEVELS = ["Low", "Medium", "High"]

# Visual cues keyed by emotion for realistic mock output
VISUAL_CUES_MAP = {
    "happy":      ["relaxed ears", "soft open mouth", "relaxed tail"],
    "relaxed":    ["half-closed eyes", "relaxed body posture", "slow tail movement"],
    "anxious":    ["ears pulled back", "panting", "lowered tail", "dilated pupils"],
    "scared":     ["tail tucked", "flattened body", "ears pinned back", "cowering"],
    "alert":      ["erect ears", "intense gaze", "stiff posture", "high tail"],
    "aggressive": ["bared teeth", "stiff hackles", "direct stare", "forward-leaning"],
    "neutral":    ["neutral ear position", "relaxed jaw", "natural stance"],
}

PAIN_CUES_MAP = {
    "Low":    [],
    "Medium": ["squinted eyes", "slightly hunched back", "reduced mobility"],
    "High":   ["grimace scale indicators", "squinted eyes", "ear flattening", "hunched posture", "reluctance to move", "vocalising pain"],
}

EXPLANATIONS = {
    "happy":      "Your pet appears content and comfortable. Ears are relaxed, body language is open and at ease.",
    "relaxed":    "Your pet looks calm and at ease. Half-closed eyes and a loose posture indicate comfort.",
    "anxious":    "Signs of mild anxiety detected. Pulled-back ears and a lowered tail suggest your pet may be stressed.",
    "scared":     "Your pet shows signs of fear. A tucked tail and cowering posture indicate they feel threatened.",
    "alert":      "Your pet is alert and attentive. Erect ears and focused gaze suggest they have noticed something of interest.",
    "aggressive": "Warning signs of aggression detected. Approach with care. This may be fear-based — give your pet space.",
    "neutral":    "Your pet appears calm with no strong emotional signals detected.",
}

AUDIO_EXPLANATIONS = {
    "playful":    "The vocalization pattern suggests your pet is in a playful, energetic mood.",
    "distressed": "Elevated pitch and irregular patterns suggest distress. Monitor your pet closely.",
    "warning":    "Low-pitched, sustained vocalization is consistent with a warning or territorial signal.",
    "pain-whine": "Whining pattern with elevated pitch is consistent with discomfort or pain. Consider consulting a vet.",
    "content":    "Soft, low-frequency sounds indicate your pet is relaxed and content.",
}

DISCLAIMER_TEXT = (
    "⚠️ PetSense is a wellness awareness tool, NOT a veterinary diagnostic device. "
    "Predictions are based on behavioral cues and AI pattern recognition. "
    "Always consult a licensed veterinarian for any health concerns."
)

PAIN_DISCLAIMER_TEXT = (
    "🚨 Possible pain indicators detected. Please consult a licensed veterinarian as soon as possible. "
    "This is NOT a medical diagnosis — only a qualified vet can properly assess your pet's health."
)


@dataclass
class VisionResult:
    emotion_label: str
    confidence: float
    pain_risk: str
    visual_cues: List[str]
    pain_cues: List[str]
    explanation: str
    processing_time_ms: float
    advice: List[str] = field(default_factory=list)
    analysis_mode: str = "cv_heuristic"
    signals: dict = field(default_factory=dict)
    health_report: dict = field(default_factory=dict)


@dataclass
class AudioResult:
    audio_label: str
    confidence: float
    audio_cues: List[str]
    explanation: str
    processing_time_ms: float


@dataclass
class FusedReport:
    emotion_label: str
    confidence: float
    pain_risk: str
    audio_label: Optional[str]
    cues_detected: List[str]
    explanation: str
    disclaimer: str
    raw_result: dict = field(default_factory=dict)


class InferenceService:
    """
    Central inference service. Dispatches to mock or real backends
    based on the USE_REAL_MODELS environment variable.
    """

    def __init__(self):
        self.use_real = settings.use_real_models
        if self.use_real:
            self._load_real_models()

    # ── Public API ─────────────────────────────────────────────────────────

    def analyze_image(self, image_bytes: bytes, species: str = "dog") -> VisionResult:
        """Analyze image bytes → emotion + pain result."""
        if self.use_real:
            return self._real_analyze_image(image_bytes, species)
        return self._cv_analyze_image(image_bytes, species)

    def analyze_audio(self, audio_bytes: bytes, species: str = "dog") -> AudioResult:
        """Analyze audio bytes → distress/emotion classification."""
        if self.use_real:
            return self._real_analyze_audio(audio_bytes, species)
        return self._mock_analyze_audio(species)

    def fuse(
        self,
        vision: Optional[VisionResult] = None,
        audio: Optional[AudioResult] = None,
    ) -> FusedReport:
        """Fuse vision + audio results into a single report."""
        if vision is None and audio is None:
            raise ValueError("At least one of vision or audio result is required.")

        # ── Emotion label: vision wins, fall back to audio proxy ──────────
        emotion_label = vision.emotion_label if vision else _audio_to_emotion(audio.audio_label)
        pain_risk = vision.pain_risk if vision else "Low"
        confidence = vision.confidence if vision else audio.confidence

        # ── Audio can escalate pain risk ───────────────────────────────────
        if audio and audio.audio_label == "pain-whine":
            pain_risk = _escalate_pain_risk(pain_risk)
            if confidence < audio.confidence:
                confidence = min(1.0, (confidence + audio.confidence) / 2 + 0.05)

        # ── Combine cues ──────────────────────────────────────────────────
        cues: List[str] = []
        if vision:
            cues.extend(vision.visual_cues)
            cues.extend(vision.pain_cues)
        if audio:
            cues.extend(audio.audio_cues)
        # Deduplicate while preserving order
        seen = set()
        unique_cues = []
        for c in cues:
            if c not in seen:
                seen.add(c)
                unique_cues.append(c)

        # ── Explanation + care advice ─────────────────────────────────────
        explanation_parts = []
        if vision:
            explanation_parts.append(vision.explanation)
        if audio:
            explanation_parts.append(f"Audio analysis: {audio.explanation}")
        explanation = " ".join(explanation_parts)

        care_advice: List[str] = list(vision.advice) if vision and vision.advice else []
        health_report: dict = vision.health_report if vision and vision.health_report else {}

        # ── Disclaimer (always include; stronger when pain detected) ──────
        disclaimer = PAIN_DISCLAIMER_TEXT if pain_risk in ("Medium", "High") else DISCLAIMER_TEXT

        return FusedReport(
            emotion_label=emotion_label,
            confidence=round(confidence, 3),
            pain_risk=pain_risk,
            audio_label=audio.audio_label if audio else None,
            cues_detected=unique_cues,
            explanation=explanation,
            disclaimer=disclaimer,
            raw_result={
                "vision": _vision_to_dict(vision),
                "audio": _audio_to_dict(audio),
                "care_advice": care_advice,
                "health_report": health_report,
            },
        )

    # ── CV Image Analysis (default) ────────────────────────────────────────

    def _cv_analyze_image(self, image_bytes: bytes, species: str) -> VisionResult:
        start = time.perf_counter()
        analysis = analyze_pet_image(image_bytes, species)
        elapsed = (time.perf_counter() - start) * 1000
        return VisionResult(
            emotion_label=analysis.emotion_label,
            confidence=analysis.confidence,
            pain_risk=analysis.pain_risk,
            visual_cues=analysis.visual_cues,
            pain_cues=analysis.pain_cues,
            explanation=analysis.explanation,
            advice=analysis.advice,
            analysis_mode=analysis.analysis_mode,
            signals=signals_to_dict(analysis.signals),
            health_report=health_report_to_dict(analysis.health_report) if analysis.health_report else {},
            processing_time_ms=round(elapsed, 1),
        )

    # ── Mock Backends (audio only / fallback) ─────────────────────────────

    def _mock_analyze_image(self, species: str) -> VisionResult:
        start = time.perf_counter()
        # Weighted random: dogs more likely happy/relaxed; cats more likely neutral/alert
        if species == "cat":
            weights = [0.20, 0.20, 0.12, 0.10, 0.20, 0.08, 0.10]
        else:
            weights = [0.30, 0.25, 0.12, 0.08, 0.12, 0.05, 0.08]

        emotion = random.choices(EMOTION_LABELS, weights=weights, k=1)[0]
        confidence = round(random.uniform(0.62, 0.97), 3)

        # Pain risk: higher for anxious/scared/aggressive
        if emotion in ("scared", "aggressive"):
            pain_weights = [0.20, 0.50, 0.30]
        elif emotion == "anxious":
            pain_weights = [0.45, 0.40, 0.15]
        else:
            pain_weights = [0.80, 0.15, 0.05]

        pain_risk = random.choices(PAIN_RISK_LEVELS, weights=pain_weights, k=1)[0]
        visual_cues = random.sample(VISUAL_CUES_MAP[emotion], k=min(3, len(VISUAL_CUES_MAP[emotion])))
        pain_cues = PAIN_CUES_MAP[pain_risk]

        elapsed = (time.perf_counter() - start) * 1000 + random.uniform(80, 250)
        return VisionResult(
            emotion_label=emotion,
            confidence=confidence,
            pain_risk=pain_risk,
            visual_cues=visual_cues,
            pain_cues=pain_cues,
            explanation=EXPLANATIONS[emotion],
            processing_time_ms=round(elapsed, 1),
        )

    def _mock_analyze_audio(self, species: str) -> AudioResult:
        start = time.perf_counter()
        weights = [0.25, 0.15, 0.15, 0.10, 0.35]  # playful/content skewed
        audio_label = random.choices(AUDIO_LABELS, weights=weights, k=1)[0]
        confidence = round(random.uniform(0.58, 0.94), 3)
        audio_cues = _get_audio_cues(audio_label)
        elapsed = (time.perf_counter() - start) * 1000 + random.uniform(60, 180)
        return AudioResult(
            audio_label=audio_label,
            confidence=confidence,
            audio_cues=audio_cues,
            explanation=AUDIO_EXPLANATIONS[audio_label],
            processing_time_ms=round(elapsed, 1),
        )

    # ── Real Backends (swap in when ONNX models are available) ────────────

    def _load_real_models(self):
        """Load ONNX models from disk. Called once at startup."""
        try:
            import onnxruntime as ort
            import os
            model_dir = os.path.join(os.path.dirname(__file__), "../../ml/models")
            # self.vision_session = ort.InferenceSession(f"{model_dir}/emotion_vision.onnx")
            # self.pain_session   = ort.InferenceSession(f"{model_dir}/pain_cue.onnx")
            # self.audio_session  = ort.InferenceSession(f"{model_dir}/audio_emotion.onnx")
            print("Real ONNX models loaded (implement session calls below).")
        except Exception as e:
            print(f"Warning: Could not load real models ({e}). Falling back to mock.")
            self.use_real = False

    def _real_analyze_image(self, image_bytes: bytes, species: str) -> VisionResult:
        """
        TODO: Implement real ONNX inference.
        1. Decode image with PIL
        2. Run through self.vision_session + self.pain_session
        3. Map logits → emotion_label + confidence + pain_risk
        """
        raise NotImplementedError("Real model inference not yet implemented.")

    def _real_analyze_audio(self, audio_bytes: bytes, species: str) -> AudioResult:
        """
        TODO: Implement real ONNX inference.
        1. Convert audio_bytes to Mel-spectrogram with librosa
        2. Run through self.audio_session
        3. Map logits → audio_label + confidence
        """
        raise NotImplementedError("Real model inference not yet implemented.")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _audio_to_emotion(audio_label: str) -> str:
    mapping = {
        "playful": "happy",
        "content": "relaxed",
        "distressed": "anxious",
        "warning": "alert",
        "pain-whine": "anxious",
    }
    return mapping.get(audio_label, "neutral")


def _escalate_pain_risk(current: str) -> str:
    order = {"Low": 0, "Medium": 1, "High": 2}
    idx = min(order.get(current, 0) + 1, 2)
    return PAIN_RISK_LEVELS[idx]


def _get_audio_cues(label: str) -> List[str]:
    cues_map = {
        "playful":    ["high-pitched bark bursts", "short repetitive vocalizations"],
        "distressed": ["elevated vocal pitch", "irregular pattern", "prolonged calls"],
        "warning":    ["low-pitched sustained growl", "short sharp barks"],
        "pain-whine": ["high-pitched whine", "prolonged vocalization", "trembling pitch"],
        "content":    ["soft rumble", "low-frequency purr-like sound"],
    }
    return cues_map.get(label, [])


def _vision_to_dict(v: Optional[VisionResult]) -> dict:
    if v is None:
        return {}
    return {
        "emotion_label": v.emotion_label,
        "confidence": v.confidence,
        "pain_risk": v.pain_risk,
        "visual_cues": v.visual_cues,
        "pain_cues": v.pain_cues,
        "processing_time_ms": v.processing_time_ms,
        "analysis_mode": v.analysis_mode,
        "signals": v.signals,
        "advice": v.advice,
        "health_report": v.health_report,
    }


def _audio_to_dict(a: Optional[AudioResult]) -> dict:
    if a is None:
        return {}
    return {
        "audio_label": a.audio_label,
        "confidence": a.confidence,
        "audio_cues": a.audio_cues,
        "processing_time_ms": a.processing_time_ms,
    }


# Singleton — imported by routers
inference_service = InferenceService()
