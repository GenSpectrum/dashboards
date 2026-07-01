from unittest.mock import MagicMock

from seed import seed_source
from tests.mock_source import MockSource

COLLECTIONS = [
    {
        "name": "Mock Collection A",
        "organism": "covid",
        "description": "A mock collection for testing.",
        "variants": [
            {
                "type": "filterObject",
                "name": "C123T",
                "filterObject": {"nucleotideMutations": ["C123T"]},
            }
        ],
    },
    {
        "name": "Mock Collection B",
        "organism": "covid",
        "description": "Another mock collection for testing.",
        "variants": [],
    },
]


def make_client(existing=None, existing_by_tag=None):
    client = MagicMock()
    client.fetch_existing_collections.return_value = existing or []
    client.fetch_existing_collections_by_tag.return_value = existing_by_tag or []
    client.create_collection.return_value = 99
    return client


# --- seed_source: create / update / mixed ---


def test_all_new_creates_all():
    client = make_client(existing=[])
    created, updated, deleted = seed_source(client, MockSource(COLLECTIONS))
    assert created == len(COLLECTIONS)
    assert updated == 0
    assert deleted == 0
    assert client.create_collection.call_count == len(COLLECTIONS)
    client.update_collection.assert_not_called()


def existing_entry(id: int, name: str) -> dict:
    return {
        "id": id,
        "name": name,
        "description": f"A collection. {MockSource.owned_tag}",
    }


def test_all_existing_updates_all():
    existing = [existing_entry(i + 1, c["name"]) for i, c in enumerate(COLLECTIONS)]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(client, MockSource(COLLECTIONS))
    assert created == 0
    assert updated == len(COLLECTIONS)
    assert deleted == 0
    assert client.update_collection.call_count == len(COLLECTIONS)
    client.create_collection.assert_not_called()


def test_mixed_creates_and_updates():
    existing = [existing_entry(10, COLLECTIONS[0]["name"])]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(client, MockSource(COLLECTIONS))
    assert created == len(COLLECTIONS) - 1
    assert updated == 1


def test_update_uses_correct_id():
    existing = [existing_entry(42, COLLECTIONS[0]["name"])]
    client = make_client(existing=existing)
    seed_source(client, MockSource([COLLECTIONS[0]]))
    client.update_collection.assert_called_once_with(42, COLLECTIONS[0])


def test_create_passes_full_collection():
    client = make_client(existing=[])
    seed_source(client, MockSource([COLLECTIONS[0]]))
    client.create_collection.assert_called_once_with(COLLECTIONS[0])


def test_returns_zero_counts_for_empty_collections():
    client = make_client(existing=[])
    created, updated, deleted = seed_source(client, MockSource([]))
    assert created == 0
    assert updated == 0
    assert deleted == 0


# --- seed_source: orphan deletion ---

TAG = "test-tag"


class TaggedMockSource(MockSource):
    owned_tag = TAG


def tagged(name: str, description: str = "") -> dict:
    return {
        "name": name,
        "organism": "covid",
        "description": description or f"A collection. {TAG}",
        "variants": [],
    }


def test_orphan_with_tag_is_deleted():
    existing = [
        {"id": 5, "name": "OldLineage", "description": f"Old. {TAG}"},
        {"id": 6, "name": "CurrentLineage", "description": f"Current. {TAG}"},
    ]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(
        client, TaggedMockSource([tagged("CurrentLineage")])
    )
    assert deleted == 1
    client.delete_collection.assert_called_once_with(5)


def test_orphan_without_tag_is_not_deleted():
    existing = [{"id": 5, "name": "ManualCollection", "description": "No tag here."}]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(client, TaggedMockSource([]))
    assert deleted == 0
    client.delete_collection.assert_not_called()


def test_no_deletion_when_owned_tag_is_none():
    existing = [{"id": 5, "name": "OldLineage", "description": f"Old. {TAG}"}]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(client, MockSource([]))
    assert deleted == 0
    client.delete_collection.assert_not_called()


def test_current_collections_are_not_deleted():
    col = tagged("ExistingLineage")
    existing = [{"id": 5, "name": "ExistingLineage", "description": col["description"]}]
    client = make_client(existing=existing)
    created, updated, deleted = seed_source(client, TaggedMockSource([col]))
    assert deleted == 0
    client.delete_collection.assert_not_called()


def test_orphan_with_real_tag_is_deleted():
    existing_by_tag = [
        {"id": 7, "name": "OldLineage", "description": "No pseudo-tag here."}
    ]
    client = make_client(existing=[], existing_by_tag=existing_by_tag)
    created, updated, deleted = seed_source(client, TaggedMockSource([]))
    assert deleted == 1
    client.delete_collection.assert_called_once_with(7)


def test_orphan_found_by_both_tag_and_description_deleted_once():
    entry = {"id": 8, "name": "OldLineage", "description": f"Old. {TAG}"}
    client = make_client(existing=[entry], existing_by_tag=[entry])
    created, updated, deleted = seed_source(client, TaggedMockSource([]))
    assert deleted == 1
    client.delete_collection.assert_called_once_with(8)
