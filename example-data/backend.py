"""Shared backend API client for collection seeders."""

import sys
import time

import requests

RETRY_ATTEMPTS = 30
RETRY_DELAY_S = 2


class BackendClient:
    def __init__(self, base_url: str, user_id: str):
        self.base_url = base_url.rstrip("/")
        self.user_id = user_id
        self._collections_url = f"{self.base_url}/collections"

    def wait_for_backend(self, attempts: int = RETRY_ATTEMPTS, delay: float = RETRY_DELAY_S):
        params = {"userId": self.user_id, "organism": "covid"}
        for attempt in range(1, attempts + 1):
            try:
                r = requests.get(self._collections_url, params=params, timeout=5)
                if r.ok or r.status_code == 404:
                    return
            except requests.RequestException:
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
