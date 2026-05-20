import sys
import pytest
import responses as rsps_lib

from api import ApiClient

BASE = "http://localhost:8080"
COLLECTIONS_URL = f"{BASE}/api/collections"
API_KEY = "test-api-key"


@pytest.fixture
def client():
    return ApiClient(BASE, API_KEY)


# --- fetch_existing_collections ---

@rsps_lib.activate
def test_fetch_existing_collections(client):
    existing = [{"id": 1, "name": "Col A"}, {"id": 2, "name": "Col B"}]
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json=existing, status=200)

    result = client.fetch_existing_collections("covid")

    assert result == existing
    req = rsps_lib.calls[0].request
    assert "organism=covid" in req.url
    assert req.headers["Authorization"] == f"Bearer {API_KEY}"


@rsps_lib.activate
def test_fetch_existing_collections_raises_on_error(client):
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json={}, status=500)
    with pytest.raises(RuntimeError, match="GET /api/collections failed"):
        client.fetch_existing_collections("covid")


# --- create_collection ---

@rsps_lib.activate
def test_create_collection_returns_id(client):
    rsps_lib.add(rsps_lib.POST, COLLECTIONS_URL, json={"id": 99}, status=201)
    col = {"name": "Test", "organism": "covid", "description": "", "variants": []}
    result = client.create_collection(col)
    assert result == 99
    assert rsps_lib.calls[0].request.headers["Authorization"] == f"Bearer {API_KEY}"


@rsps_lib.activate
def test_create_collection_raises_on_non_201(client):
    rsps_lib.add(rsps_lib.POST, COLLECTIONS_URL, json={}, status=200)
    with pytest.raises(RuntimeError, match="POST /api/collections failed"):
        client.create_collection({"name": "X", "organism": "covid", "description": "", "variants": []})


# --- update_collection ---

@rsps_lib.activate
def test_update_collection_puts_correct_url(client):
    rsps_lib.add(rsps_lib.PUT, f"{COLLECTIONS_URL}/55", json={}, status=200)
    col = {"name": "Updated", "organism": "covid", "description": "", "variants": []}
    client.update_collection(55, col)

    req = rsps_lib.calls[0].request
    assert "/api/collections/55" in req.url
    assert req.headers["Authorization"] == f"Bearer {API_KEY}"


@rsps_lib.activate
def test_update_collection_raises_on_error(client):
    rsps_lib.add(rsps_lib.PUT, f"{COLLECTIONS_URL}/55", json={}, status=404)
    with pytest.raises(RuntimeError, match="PUT /api/collections/55 failed"):
        client.update_collection(55, {"name": "X", "organism": "covid", "description": "", "variants": []})


# --- wait_for_api ---

@rsps_lib.activate
def test_wait_for_api_succeeds_immediately(client):
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json=[], status=200)
    client.wait_for_api()
    assert len(rsps_lib.calls) == 1


@rsps_lib.activate
def test_wait_for_api_retries_then_succeeds(client):
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json={}, status=500)
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json={}, status=500)
    rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json=[], status=200)
    client.wait_for_api(attempts=5, delay=0)
    assert len(rsps_lib.calls) == 3


@rsps_lib.activate
def test_wait_for_api_exits_after_max_attempts(client):
    for _ in range(3):
        rsps_lib.add(rsps_lib.GET, COLLECTIONS_URL, json={}, status=500)
    with pytest.raises(SystemExit) as exc:
        client.wait_for_api(attempts=3, delay=0)
    assert exc.value.code == 1
