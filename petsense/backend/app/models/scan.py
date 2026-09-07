from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Scan type: "image" | "audio" | "combined"
    scan_type = Column(String, nullable=False)

    # Vision results
    emotion_label = Column(String, nullable=True)    # happy, relaxed, anxious, scared, alert, aggressive, neutral
    confidence = Column(Float, nullable=True)         # 0.0 – 1.0
    pain_risk = Column(String, nullable=True)         # Low | Medium | High

    # Audio results
    audio_label = Column(String, nullable=True)       # playful, distressed, warning, pain-whine, content

    # Detected cues (list of strings stored as JSON)
    cues_detected = Column(JSON, default=list)

    # Plain-language explanation
    explanation = Column(String, nullable=True)

    # Always-present disclaimer
    disclaimer = Column(String, nullable=True)

    # File paths (relative to UPLOAD_DIR)
    image_path = Column(String, nullable=True)
    audio_path = Column(String, nullable=True)

    # Raw model outputs stored for debugging / retraining
    raw_result = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pet = relationship("Pet", back_populates="scans")
    user = relationship("User", back_populates="scans")
