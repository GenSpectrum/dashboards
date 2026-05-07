import sys
import pytest
import responses as rsps_lib

from backend import BackendClient, SYNC_GITHUB_ID, SYNC_NAME

BASE = "http://localhost:8080"
SYNC_URL = f"{BASE}/users/sync"
COLLECTIONS_URL = f"{BASE}/collections"


@pytest.fixture
def client():
    return BackendClient(BASE)


# --- sync_user ---

@rsps_lib.activate
def test_sync_user_sets_user_id(client):
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={"id": 42}, status=200)
    result = client.sync_user()
    assert result == 42
    assert client.user_id == 42


@rsps_lib.activate
def test_sync_user_sends_correct_body(client):
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={"id": 1}, status=200)
    client.sync_user()
    body = rsps_lib.calls[0].request.body
    import json
    parsed = json.loads(body)
    assert parsed["githubId"] == SYNC_GITHUB_ID
    assert parsed["name"] == SYNC_NAME


@rsps_lib.activate
def test_sync_user_raises_on_error(client):
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={"error": "bad"}, status=500)
    with pytest.raises(RuntimeError, match="POST /users/sync failed"):
        client.sync_user()


# --- fetch_existing_collections ---

@rsps_lib.activate
def test_fetch_existing_collections(client):
    client.user_id = 7
    existing = [{"id": 1, "name": "Col A"}, {"id": 2, "name": "Col B"}]
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json=existing, status=200)

    result = client.fetch_existing_collections("covid")

    assert result == existing
    req = rsps_lib.calls[0].request
    assert "userId=7" in req.url
    assert "organism=covid" in req.url


@rsps_lib.activate
def test_fetch_existing_collections_raises_on_error(client):
    client.user_id = 7
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json={}, status=500)
    with pytest.raises(RuntimeError, match="GET /collections failed"):
        client.fetch_existing_collections("covid")


# --- create_collection ---

@rsps_lib.activate
def test_create_collection_returns_id(client):
    client.user_id = 7
    rsps_lib.add(rsps_lib.POST, COLLECTIONS_URL, json={"id": 99}, status=201)
    col = {"name": "Test", "organism": "covid", "description": "", "variants": []}
    result = client.create_collection(col)
    assert result == 99


@rsps_lib.activate
def test_create_collection_raises_on_non_201(client):
    client.user_id = 7
    rsps_lib.add(rsps_lib.POST, COLLECTIONS_URL, json={}, status=200)
    with pytest.raises(RuntimeError, match="POST /collections failed"):
        client.create_collection({"name": "X", "organism": "covid", "description": "", "variants": []})


# --- update_collection ---

@rsps_lib.activate
def test_update_collection_puts_correct_url(client):
    client.user_id = 7
    rsps_lib.add(rsps_lib.PUT, f"{COLLECTIONS_URL}/55", json={}, status=200)
    col = {"name": "Updated", "organism": "covid", "description": "", "variants": []}
    client.update_collection(55, col)

    req = rsps_lib.calls[0].request
    assert "/collections/55" in req.url
    assert "userId=7" in req.url


@rsps_lib.activate
def test_update_collection_raises_on_error(client):
    client.user_id = 7
    rsps_lib.add(rsps_lib.PUT, f"{COLLECTIONS_URL}/55", json={}, status=404)
    with pytest.raises(RuntimeError, match="PUT /collections/55 failed"):
        client.update_collection(55, {"name": "X", "organism": "covid", "description": "", "variants": []})


# --- wait_for_backend ---

@rsps_lib.activate
def test_wait_for_backend_succeeds_immediately(client):
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={"id": 5}, status=200)
    client.wait_for_backend()
    assert client.user_id == 5
    assert len(rsps_lib.calls) == 1


@rsps_lib.activate
def test_wait_for_backend_retries_then_succeeds(client):
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={}, status=500)
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={}, status=500)
    rsps_lib.add(rsps_lib.POST, SYNC_URL, json={"id": 8}, status=200)
    client.wait_for_backend(attempts=5, delay=0)
    assert client.user_id == 8
    assert len(rsps_lib.calls) == 3


@rsps_lib.activate
def test_wait_for_backend_exits_after_max_attempts(client):
    for _ in range(3):
        rsps_lib.add(rsps_lib.POST, SYNC_URL, json={}, status=500)
    with pytest.raises(SystemExit) as exc:
        client.wait_for_backend(attempts=3, delay=0)
    assert exc.value.code == 1
