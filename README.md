# 🐾 PetSense — Smart Pet Emotion & Pain Translator

> An AI-powered web app that helps you understand what your dog or cat is feeling.

PetSense analyzes your pet's facial expression, body posture, and vocal sounds from camera/microphone input to estimate emotional state and possible pain/discomfort signals — then displays results in plain language with a confidence score.

> ⚠️ **Wellness Disclaimer:** PetSense is a wellness awareness tool, NOT a medical diagnostic device. Always consult a licensed veterinarian for health concerns.

---

## ✨ Features

- 📸 **Image/Video Emotion Detection** — classify emotion: happy, relaxed, anxious, scared, alert, aggressive, neutral
- 😿 **Pain Indicator Detection** — grimace scale cues, ear position, body posture analysis with pain-risk score (Low / Medium / High)
- 🔊 **Audio Distress Detection** — classify bark/meow/whine: playful, distressed, warning, pain-whine, content
- 📋 **Combined Report** — fused video + audio result with confidence score and plain-language explanation
- 📈 **History & Trends** — track your pet's mood and pain signals over time
- 🏥 **Vet Finder** — links to nearby vets when pain risk is Medium or High

---

## 🏗️ Architecture

```
[Camera/Mic Input] → [Frontend Capture Layer]
        │
        ▼
[Preprocessing Service] → (frame extraction, face/keypoint detection, audio segmentation)
        │
        ▼
[Inference Layer] → CV Emotion Model + Pain-Cue Model + Audio Emotion Model
        │
        ▼
[Fusion Engine] → combines CV + audio scores → final label + confidence + pain-risk level
        │
        ▼
[API Response] → JSON: {emotion, confidence, pain_risk, cues[], disclaimer}
        │
        ▼
[Frontend Result Card] → visual summary, history log, vet-consult prompt
```

---

## 🗂️ Project Structure

```
petsense/
├── frontend/          # React + Vite + TailwindCSS web app
├── backend/           # FastAPI Python backend
├── ml/                # ML model training & fusion code
├── docs/              # Architecture & API documentation
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Node 18+ and Python 3.11+

### With Docker (recommended)

```bash
git clone <repo-url>
cd petsense
cp backend/.env.example backend/.env   # edit as needed
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🤖 ML Models

The app ships with **realistic mock inference** so it works out of the box. To use real models:

1. Train models using scripts in `/ml/training/`
2. Export to ONNX and place in `/ml/models/`
3. Set `USE_REAL_MODELS=true` in `backend/.env`

See [ML documentation](docs/architecture.md#ml-models) for details.

---

## 🔑 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./petsense.db` | DB connection string |
| `SECRET_KEY` | `changeme` | JWT signing secret |
| `USE_REAL_MODELS` | `false` | Switch to ONNX inference |
| `UPLOAD_DIR` | `./uploads` | Media upload directory |

---

## 📜 License

MIT License. See [LICENSE](LICENSE).

---

## ⚕️ Medical Disclaimer

PetSense outputs are for informational purposes only. Pain risk assessments are based on behavioral cues and are not veterinary diagnoses. If your pet shows signs of distress or pain, please consult a licensed veterinarian immediately.
