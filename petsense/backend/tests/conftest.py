"""
Shared pytest fixtures for PetSense backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# In-memory SQLite for tests
TEST_DB_URL = "sqlite:///./test_petsense.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    """Register a user and return credentials + token."""
    resp = client.post("/auth/register", json={
        "email": "test@petsense.com",
        "password": "TestPassword123",
        "full_name": "Test User",
    })
    if resp.status_code == 409:
        resp = client.post("/auth/login", json={
            "email": "test@petsense.com",
            "password": "TestPassword123",
        })
    assert resp.status_code in (200, 201)
    data = resp.json()
    return {"token": data["access_token"], "user": data.get("user", {})}


@pytest.fixture()
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}
