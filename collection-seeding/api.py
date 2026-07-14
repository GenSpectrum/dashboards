"""Shared backend API client for collection seeders."""

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

    def wait_for_api(
        self, attempts: int = RETRY_ATTEMPTS, delay: float = RETRY_DELAY_S
    ):
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
        raise RuntimeError(
            f"API at {self.base_url} did not become ready after {attempts} attempts."
        )

    def get_my_user_id(self) -> int:
        r = requests.get(
            f"{self.base_url}/api/users/me",
            headers=self._auth_headers,
            timeout=10,
        )
        if not r.ok:
            raise RuntimeError(f"GET /api/users/me failed: {r.status_code} {r.text}")
        return r.json()["id"]

    def fetch_existing_collections(
        self, organism: str, user_id: int
    ) -> list[ExistingCollection]:
        r = requests.get(
            self._collections_url,
            params={"organism": organism, "userId": user_id},
            headers=self._auth_headers,
            timeout=10,
        )
        if not r.ok:
            raise RuntimeError(f"GET /api/collections failed: {r.status_code} {r.text}")
        return r.json()

    def fetch_existing_collections_by_tag(
        self, tag: str, organism: str, user_id: int
    ) -> list[ExistingCollection]:
        r = requests.get(
            self._collections_url,
            params={"tags": tag, "organism": organism, "userId": user_id},
            headers=self._auth_headers,
            timeout=10,
        )
        if not r.ok:
            raise RuntimeError(
                f"GET /api/collections?tags={tag} failed: {r.status_code} {r.text}"
            )
        return r.json()

    def create_collection(self, collection: Collection) -> int:
        r = requests.post(
            self._collections_url,
            headers=self._auth_headers,
            json=collection,
            timeout=10,
        )
        if r.status_code != 201:
            raise RuntimeError(
                f"POST /api/collections failed: {r.status_code} {r.text}"
            )
        return r.json()["id"]

    def delete_collection(self, collection_id: int) -> None:
        r = requests.delete(
            f"{self._collections_url}/{collection_id}",
            headers=self._auth_headers,
            timeout=10,
        )
        if not r.ok:
            raise RuntimeError(
                f"DELETE /api/collections/{collection_id} failed: {r.status_code} {r.text}"
            )

    def update_collection(self, collection_id: int, collection: Collection) -> None:
        # CollectionUpdate has no organism field; sending it causes a 400 (fail-on-unknown-properties=true)
        body = {k: v for k, v in collection.items() if k != "organism"}
        r = requests.put(
            f"{self._collections_url}/{collection_id}",
            headers=self._auth_headers,
            json=body,
            timeout=10,
        )
        if not r.ok:
            raise RuntimeError(
                f"PUT /api/collections/{collection_id} failed: {r.status_code} {r.text}"
            )
