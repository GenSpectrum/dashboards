"""Mock data source for use in tests."""

from models import Collection
from sources import Source

COLLECTIONS: list[Collection] = [
    {
        "name": "Mock Collection A",
        "organism": "covid",
        "description": "A mock collection for testing.",
        "variants": [{"type": "filterObject", "name": "C123T", "filterObject": {"nucleotideMutations": ["C123T"]}}],
    },
    {
        "name": "Mock Collection B",
        "organism": "covid",
        "description": "Another mock collection for testing.",
        "variants": [],
    },
]


class MockSource(Source):
    name = "mock-source"

    def __init__(self, collections: list[Collection] | None = None):
        self._collections = list(COLLECTIONS) if collections is None else collections

    def get_collections(self) -> list[Collection]:
        return self._collections
