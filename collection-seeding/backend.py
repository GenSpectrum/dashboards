"""Shared backend API client for collection seeders."""

import sys
import time

import requests

RETRY_ATTEMPTS = 30
RETRY_DELAY_S = 2


SYNC_GITHUB_ID = "218605180"  # https://github.com/genspectrum-bot
SYNC_NAME = "GenSpectrum Team"


class BackendClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.user_id: int | None = None
        self._collections_url = f"{self.base_url}/collections"

    def sync_user(self, github_id: str = SYNC_GITHUB_ID, name: str = SYNC_NAME, email: str | None = None) -> int:
        """Upsert the seed user and store the returned internal id."""
        body = {"githubId": github_id, "name": name, "email": email}
        r = requests.post(f"{self.base_url}/users/sync", json=body, timeout=10)
        if not r.ok:
            raise RuntimeError(f"POST /users/sync failed: {r.status_code} {r.text}")
        self.user_id = r.json()["id"]
        return self.user_id

    def wait_for_backend(self, attempts: int = RETRY_ATTEMPTS, delay: float = RETRY_DELAY_S):
        """Poll until the backend is ready by repeatedly attempting user sync."""
        for attempt in range(1, attempts + 1):
            try:
                self.sync_user()
                return
            except (requests.RequestException, RuntimeError):
                pass
            print(f"Waiting for backend... (attempt {attempt}/{attempts})")
            time.sleep(delay)
        print(
            f"Backend at {self.base_url} did not become ready after {attempts} attempts.",
            file=sys.stderr,
        )
        sys.exit(1)

    def fetch_existing_collections(self, organism: str) -> list[dict]:
        params = {"userId": self.user_id, "organism": organism}
        r = requests.get(self._collections_url, params=params, timeout=10)
        if not r.ok:
            raise RuntimeError(f"GET /collections failed: {r.status_code} {r.text}")
        return r.json()

    def create_collection(self, collection: dict) -> str:
        params = {"userId": self.user_id}
        r = requests.post(self._collections_url, params=params, json=collection, timeout=10)
        if r.status_code != 201:
            raise RuntimeError(f"POST /collections failed: {r.status_code} {r.text}")
        return r.json()["id"]

    def update_collection(self, collection_id: int, collection: dict) -> None:
        params = {"userId": self.user_id}
        r = requests.put(f"{self._collections_url}/{collection_id}", params=params, json=collection, timeout=10)
        if not r.ok:
            raise RuntimeError(f"PUT /collections/{collection_id} failed: {r.status_code} {r.text}")
