def test_register_success(client):
    resp = client.post("/auth/register", json={
        "email": "newuser@test.com",
        "password": "Password123",
        "full_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@test.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "Password123"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_success(client):
    client.post("/auth/register", json={"email": "login@test.com", "password": "Pass123"})
    resp = client.post("/auth/login", json={"email": "login@test.com", "password": "Pass123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "wp@test.com", "password": "RealPass"})
    resp = client.post("/auth/login", json={"email": "wp@test.com", "password": "WrongPass"})
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@petsense.com"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_update_consent(client, auth_headers):
    resp = client.patch("/auth/me/consent", json={"data_consent": True}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data_consent"] is True
