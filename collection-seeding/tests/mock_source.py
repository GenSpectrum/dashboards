from models import Collection
from sources import Source


class MockSource(Source):
    name = "mock-source"
    organism = "covid"
    owned_tag = "mock-tag"

    def __init__(self, collections: list[Collection]):
        self._collections = collections

    def get_collections(self) -> list[Collection]:
        return self._collections
