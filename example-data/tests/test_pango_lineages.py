import json
import responses as rsps_lib

from sources.pango_lineages import _build_collection, get_collections, DATA_URL, NAME

SAMPLE_DATA = {
    "BA.2": {
        "lineage": "BA.2",
        "unaliased": "B.1.1.529.2",
        "parent": "BA",
        "nextstrainClade": "22C",
        "nucSubstitutions": ["C241T", "A23403G", ""],
        "designationDate": "2022-01-20",
    },
    "XBB": {
        "lineage": "XBB",
        "unaliased": "XBB",
        "parent": "",
        "nextstrainClade": "",
        "nucSubstitutions": [""],
        "designationDate": "",
    },
    "BA.5": {
        "lineage": "BA.5",
        "unaliased": "B.1.1.529.5",
        "parent": "BA",
        "nextstrainClade": "22B",
        "nucSubstitutions": ["C241T", "T19955C"],
        "designationDate": "2022-05-06",
    },
}


def test_name():
    assert NAME == "covid-pango-lineages"


# --- _build_collection ---

def test_build_collection_basic():
    col = _build_collection(SAMPLE_DATA["BA.2"])
    assert col["name"] == "BA.2"
    assert col["organism"] == "covid"


def test_build_collection_description_format():
    col = _build_collection(SAMPLE_DATA["BA.2"])
    assert "BA.2" in col["description"]
    assert "BA" in col["description"]       # parent
    assert "22C" in col["description"]      # clade
    assert "2022-01-20" in col["description"]


def test_build_collection_filters_blank_subs():
    col = _build_collection(SAMPLE_DATA["BA.2"])
    # nucSubstitutions has ["C241T", "A23403G", ""] — blank should be dropped
    assert len(col["variants"]) == 2
    names = [v["name"] for v in col["variants"]]
    assert "C241T" in names
    assert "A23403G" in names


def test_build_collection_variant_structure():
    col = _build_collection(SAMPLE_DATA["BA.2"])
    for v in col["variants"]:
        assert v["type"] == "filterObject"
        assert "nucleotideMutations" in v["filterObject"]
        assert len(v["filterObject"]["nucleotideMutations"]) == 1


def test_build_collection_missing_fields_use_defaults():
    col = _build_collection(SAMPLE_DATA["XBB"])
    assert "—" in col["description"]       # parent and clade fallback
    assert "unknown" in col["description"]  # date fallback


# --- get_collections ---

@rsps_lib.activate
def test_get_collections_fetches_data_url():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    get_collections()
    assert len(rsps_lib.calls) == 1
    assert rsps_lib.calls[0].request.url == DATA_URL


@rsps_lib.activate
def test_get_collections_excludes_empty_variants():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = get_collections()
    # XBB has only blank subs → should be excluded
    names = [c["name"] for c in cols]
    assert "XBB" not in names


@rsps_lib.activate
def test_get_collections_respects_limit():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = get_collections(limit=1)
    assert len(cols) <= 1


@rsps_lib.activate
def test_get_collections_no_limit_returns_all_valid():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = get_collections(limit=0)
    # BA.2 and BA.5 have valid subs; XBB does not
    assert len(cols) == 2
