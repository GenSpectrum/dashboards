from unittest.mock import MagicMock

from seed import seed_source
from tests.mock_source import MockSource

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


def make_client(existing=None):
    client = MagicMock()
    client.fetch_existing_collections.return_value = existing or []
    client.create_collection.return_value = 99
    return client


# --- seed_source: create / update / mixed ---

def test_all_new_creates_all():
    client = make_client(existing=[])
    created, updated = seed_source(client, MockSource(COLLECTIONS))
    assert created == len(COLLECTIONS)
    assert updated == 0
    assert client.create_collection.call_count == len(COLLECTIONS)
    client.update_collection.assert_not_called()


def test_all_existing_updates_all():
    existing = [{"id": i + 1, "name": c["name"]} for i, c in enumerate(COLLECTIONS)]
    client = make_client(existing=existing)
    created, updated = seed_source(client, MockSource(COLLECTIONS))
    assert created == 0
    assert updated == len(COLLECTIONS)
    assert client.update_collection.call_count == len(COLLECTIONS)
    client.create_collection.assert_not_called()


def test_mixed_creates_and_updates():
    existing = [{"id": 10, "name": COLLECTIONS[0]["name"]}]
    client = make_client(existing=existing)
    created, updated = seed_source(client, MockSource(COLLECTIONS))
    assert created == len(COLLECTIONS) - 1
    assert updated == 1


def test_update_uses_correct_id():
    existing = [{"id": 42, "name": COLLECTIONS[0]["name"]}]
    client = make_client(existing=existing)
    seed_source(client, MockSource([COLLECTIONS[0]]))
    client.update_collection.assert_called_once_with(42, COLLECTIONS[0])


def test_create_passes_full_collection():
    client = make_client(existing=[])
    seed_source(client, MockSource([COLLECTIONS[0]]))
    client.create_collection.assert_called_once_with(COLLECTIONS[0])


def test_fetch_called_once_per_organism():
    multi = [
        {**COLLECTIONS[0], "organism": "covid"},
        {**COLLECTIONS[1], "organism": "mpox"},
    ]
    client = make_client(existing=[])
    seed_source(client, MockSource(multi))
    assert client.fetch_existing_collections.call_count == 2
    organisms_fetched = {c.args[0] for c in client.fetch_existing_collections.call_args_list}
    assert organisms_fetched == {"covid", "mpox"}


def test_returns_zero_counts_for_empty_collections():
    client = make_client(existing=[])
    created, updated = seed_source(client, MockSource([]))
    assert created == 0
    assert updated == 0
