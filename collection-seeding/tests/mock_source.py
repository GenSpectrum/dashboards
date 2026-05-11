"""Mock data source for use in tests."""

NAME = "mock-source"

COLLECTIONS = [
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


def get_collections(limit: int = 0) -> list[dict]:
    return list(COLLECTIONS)
