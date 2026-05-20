"""Shared backend API client for collection seeders."""

import sys
import time

import requests

from models import Collection, ExistingCollection

RETRY_ATTEMPTS = 30
RETRY_DELAY_S = 2


class ApiClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self._collections_url = f"{self.base_url}/api/collections"
        self._auth_headers = {"Authorization": f"Bearer {api_key}"}

    def wait_for_api(self, attempts: int = RETRY_ATTEMPTS, delay: float = RETRY_DELAY_S):
        """Poll until the API is ready by checking the collections endpoint."""
        for attempt in range(1, attempts + 1):
            try:
                r = requests.get(self._collections_url, timeout=10)
                if r.ok:
                    return
            except requests.RequestException:
                pass
            print(f"Waiting for API... (attempt {attempt}/{attempts})")
            time.sleep(delay)
        print(
            f"API at {self.base_url} did not become ready after {attempts} attempts.",
            file=sys.stderr,
        )
        sys.exit(1)

    def fetch_existing_collections(self, organism: str) -> list[ExistingCollection]:
        r = requests.get(self._collections_url, params={"organism": organism}, headers=self._auth_headers, timeout=10)
        if not r.ok:
            raise RuntimeError(f"GET /api/collections failed: {r.status_code} {r.text}")
        return r.json()

    def create_collection(self, collection: Collection) -> int:
        r = requests.post(self._collections_url, headers=self._auth_headers, json=collection, timeout=10)
        if r.status_code != 201:
            raise RuntimeError(f"POST /api/collections failed: {r.status_code} {r.text}")
        return r.json()["id"]

    def update_collection(self, collection_id: int, collection: Collection) -> None:
        r = requests.put(f"{self._collections_url}/{collection_id}", headers=self._auth_headers, json=collection, timeout=10)
        if not r.ok:
            raise RuntimeError(f"PUT /api/collections/{collection_id} failed: {r.status_code} {r.text}")
