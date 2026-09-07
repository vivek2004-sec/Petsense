def test_create_pet(client, auth_headers):
    resp = client.post("/pets", json={"name": "Buddy", "species": "dog", "breed": "Labrador"}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Buddy"
    assert data["species"] == "dog"


def test_list_pets(client, auth_headers):
    client.post("/pets", json={"name": "Whiskers", "species": "cat"}, headers=auth_headers)
    resp = client.get("/pets", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_pet(client, auth_headers):
    create = client.post("/pets", json={"name": "Max", "species": "dog"}, headers=auth_headers)
    pet_id = create.json()["id"]
    resp = client.get(f"/pets/{pet_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == pet_id


def test_invalid_species(client, auth_headers):
    resp = client.post("/pets", json={"name": "Parrot", "species": "bird"}, headers=auth_headers)
    assert resp.status_code == 422


def test_delete_pet(client, auth_headers):
    create = client.post("/pets", json={"name": "ToDelete", "species": "cat"}, headers=auth_headers)
    pet_id = create.json()["id"]
    resp = client.delete(f"/pets/{pet_id}", headers=auth_headers)
    assert resp.status_code == 204
    # Should now 404
    resp2 = client.get(f"/pets/{pet_id}", headers=auth_headers)
    assert resp2.status_code == 404
