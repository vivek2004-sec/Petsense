from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class ScanResponse(BaseModel):
    id: int
    pet_id: Optional[int]
    user_id: int
    scan_type: str
    emotion_label: Optional[str]
    confidence: Optional[float]
    pain_risk: Optional[str]
    audio_label: Optional[str]
    cues_detected: List[str]
    explanation: Optional[str]
    disclaimer: Optional[str]
    image_path: Optional[str]
    audio_path: Optional[str]
    raw_result: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ScanHistoryPoint(BaseModel):
    """Lightweight point for trend charts."""
    id: int
    scan_type: str
    emotion_label: Optional[str]
    pain_risk: Optional[str]
    confidence: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
