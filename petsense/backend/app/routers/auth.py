from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, ConsentUpdate, GoogleLoginRequest
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account and return a JWT token."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.patch("/me/consent", response_model=UserResponse)
def update_consent(
    payload: ConsentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update data-reuse consent (opt-in / opt-out)."""
    current_user.data_consent = payload.data_consent
    db.commit()
    db.refresh(current_user)
    return current_user


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.config import get_settings


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with a Google ID token."""
    email = None
    full_name = None

    # Support local demo/testing mode when token starts with demo_google_token
    if payload.token and payload.token.startswith("demo_google_token"):
        email = "demo.google.user@petsense.app"
        full_name = "Google Test User"
    else:
        try:
            settings = get_settings()
            client_id = settings.google_client_id
            if client_id and (client_id.startswith("1000000000000-placeholder") or not client_id.strip()):
                client_id = None

            idinfo = id_token.verify_oauth2_token(
                payload.token,
                google_requests.Request(),
                audience=client_id,
            )

            email = idinfo.get("email")
            full_name = idinfo.get("name")
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Google authentication failed: {str(e)}")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No email address returned from Google.")

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been disabled.")
        if full_name and not user.full_name:
            user.full_name = full_name
            db.commit()
            db.refresh(user)
    else:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=None,  # No password for OAuth users
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))
