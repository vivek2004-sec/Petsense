# PetSense API Documentation

The PetSense backend exposes a RESTful API built with FastAPI. Complete interactive documentation is automatically generated and available at `/docs` when running the backend.

## Base URL
`http://localhost:8000` (Local Development)

## Authentication
Most endpoints require a JWT token passed in the `Authorization` header:
`Authorization: Bearer <token>`

## Key Endpoints

### Auth
- `POST /auth/register` - Create a new account
- `POST /auth/login` - Authenticate and get JWT
- `GET /auth/me` - Get current user profile

### Pets
- `POST /pets` - Create a pet profile
- `GET /pets` - List user's pets
- `GET /pets/{pet_id}` - Get specific pet
- `PATCH /pets/{pet_id}` - Update pet details
- `POST /pets/{pet_id}/photo` - Upload pet photo (multipart/form-data)
- `DELETE /pets/{pet_id}` - Delete pet and its scans

### Analysis (Inference)
- `POST /analyze/image` - Analyze a photo/video (multipart/form-data)
- `POST /analyze/audio` - Analyze an audio clip (multipart/form-data)
- `POST /analyze/combined` - Analyze both image and audio together (multipart/form-data)

### Scans (History)
- `GET /scans` - List user's scan history (supports pagination and pet filtering)
- `GET /scans/{scan_id}` - Get a specific scan result
- `GET /scans/pets/{pet_id}/history` - Lightweight scan history for trend charts
- `DELETE /scans/{scan_id}` - Delete a scan

---
*For schema details, request/response formats, and validation rules, visit the `/docs` endpoint on the running server.*
