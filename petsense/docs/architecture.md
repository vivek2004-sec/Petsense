# PetSense Architecture

## High-Level System Design

PetSense uses a modern web stack (React/Vite) paired with a high-performance async Python backend (FastAPI) to handle media uploads and AI inference.

### 1. Frontend (React + Vite)
- **Framework:** React 18 with Vite for fast HMR and optimized builds.
- **Styling:** TailwindCSS with a custom glassmorphism design system.
- **State/Auth:** React Context for JWT auth management.
- **Components:** Modular structure (e.g., `CameraCapture` uses browser APIs, `ResultCard` handles complex conditional rendering for pain alerts).
- **Charts:** Recharts for historical trend analysis.

### 2. Backend (FastAPI)
- **API Framework:** FastAPI, chosen for async support and automatic OpenAPI documentation.
- **Database:** SQLAlchemy ORM with SQLite for local dev and PostgreSQL for production.
- **Auth:** JWT (JSON Web Tokens) with bcrypt password hashing.
- **Uploads:** Handled via `UploadFile`, stored locally (or S3 in full prod), and served via `StaticFiles`.

### 3. ML Models
The application is designed to use an ensemble of models:
- **Vision Model (CV):** Analyzes facial expressions and body posture. Expected architecture: EfficientNet or ResNet fine-tuned on animal datasets.
- **Pain Cue Classifier:** Specifically trained to recognize grimace-scale features.
- **Audio Model:** Converts audio to Mel-spectrograms (via librosa) and classifies using a CRNN (Convolutional Recurrent Neural Network).
- **Fusion Engine:** Combines vision and audio logits using a weighted heuristic or a trained logistic regression head to produce the final confidence and pain-risk score.

*Note: The current build ships with a realistic Mock Inference Service to allow full E2E testing without requiring trained ONNX models.*

### 4. Infrastructure
- **Containerization:** Docker Compose orchestrates the frontend, backend, and Postgres database.
- **CI/CD:** GitHub Actions workflow configured for testing and Docker builds.
