import io
from PIL import Image


def _make_fake_image() -> bytes:
    """Create a tiny valid JPEG in memory."""
    img = Image.new("RGB", (64, 64), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_fake_audio() -> bytes:
    """Create a minimal WAV file (44-byte header, silence)."""
    import struct
    num_samples = 1024
    data = b"\x00" * num_samples * 2
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + len(data), b"WAVE",
        b"fmt ", 16, 1, 1, 16000, 32000, 2, 16,
        b"data", len(data),
    )
    return header + data


def test_analyze_image(client, auth_headers):
    img_bytes = _make_fake_image()
    resp = client.post(
        "/analyze/image",
        headers=auth_headers,
        files={"file": ("pet.jpg", img_bytes, "image/jpeg")},
        data={"species": "dog"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["emotion_label"] in ["happy", "relaxed", "anxious", "scared", "alert", "aggressive", "neutral"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["pain_risk"] in ["Low", "Medium", "High"]
    assert data["disclaimer"] is not None
    assert isinstance(data["cues_detected"], list)


def test_analyze_audio(client, auth_headers):
    aud_bytes = _make_fake_audio()
    resp = client.post(
        "/analyze/audio",
        headers=auth_headers,
        files={"file": ("bark.wav", aud_bytes, "audio/wav")},
        data={"species": "dog"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["audio_label"] in ["playful", "distressed", "warning", "pain-whine", "content"]
    assert data["scan_type"] == "audio"


def test_analyze_combined(client, auth_headers):
    img_bytes = _make_fake_image()
    aud_bytes = _make_fake_audio()
    resp = client.post(
        "/analyze/combined",
        headers=auth_headers,
        files={
            "image_file": ("pet.jpg", img_bytes, "image/jpeg"),
            "audio_file": ("bark.wav", aud_bytes, "audio/wav"),
        },
        data={"species": "cat"},
    )
    assert resp.status_code == 201
    assert resp.json()["scan_type"] == "combined"


def test_unsupported_image_type(client, auth_headers):
    resp = client.post(
        "/analyze/image",
        headers=auth_headers,
        files={"file": ("file.txt", b"hello", "text/plain")},
        data={"species": "dog"},
    )
    assert resp.status_code == 415


def test_scan_history(client, auth_headers):
    img_bytes = _make_fake_image()
    client.post(
        "/analyze/image",
        headers=auth_headers,
        files={"file": ("pet.jpg", img_bytes, "image/jpeg")},
        data={"species": "dog"},
    )
    resp = client.get("/scans", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
