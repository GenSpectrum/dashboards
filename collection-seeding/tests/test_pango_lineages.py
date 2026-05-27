import responses as rsps_lib

from sources.pango_lineages import PangoLineagesSource, DATA_URL

SAMPLE_DATA = {
    "BA.2": {
        "lineage": "BA.2",
        "unaliased": "B.1.1.529.2",
        "parent": "BA",
        "nextstrainClade": "22C",
        "nucSubstitutions": ["C241T", "A23403G", ""],
        "aaSubstitutions": ["S:N501Y", ""],
        "nucSubstitutionsNew": ["A23403G"],
        "aaSubstitutionsNew": ["S:N501Y"],
        "designationDate": "2022-01-20",
    },
    "XBB": {
        "lineage": "XBB",
        "unaliased": "XBB",
        "parent": "",
        "nextstrainClade": "",
        "nucSubstitutions": [""],
        "aaSubstitutions": [""],
        "nucSubstitutionsNew": [""],
        "aaSubstitutionsNew": [""],
        "designationDate": "",
    },
    "BA.5": {
        "lineage": "BA.5",
        "unaliased": "B.1.1.529.5",
        "parent": "BA",
        "nextstrainClade": "22B",
        "nucSubstitutions": ["C241T", "T19955C"],
        "aaSubstitutions": ["S:L452R"],
        "nucSubstitutionsNew": ["T19955C"],
        "aaSubstitutionsNew": [],
        "designationDate": "2022-05-06",
    },
}


def test_name():
    assert PangoLineagesSource.name == "covid-pango-lineages"


# --- _build_collection ---


def test_build_collection_basic():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    assert col["name"] == "BA.2"
    assert col["organism"] == "covid"


def test_build_collection_description_format():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    assert "BA.2" in col["description"]
    assert "BA" in col["description"]  # parent
    assert "22C" in col["description"]  # clade
    assert "2022-01-20" in col["description"]


def test_build_collection_missing_fields_use_defaults():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["XBB"])
    assert "—" in col["description"]  # parent and clade fallback
    assert "unknown" in col["description"]  # date fallback


def test_build_collection_always_four_variants():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    assert len(col["variants"]) == 4


def test_build_collection_variant_names():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    names = [v["name"] for v in col["variants"]]
    assert names == [
        "Nucleotide substitutions",
        "Amino acid substitutions",
        "New nucleotide substitutions",
        "New amino acid substitutions",
    ]


def test_build_collection_variant_filter_keys():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    variants = col["variants"]
    assert "nucleotideMutations" in variants[0]["filterObject"]
    assert "aminoAcidMutations" in variants[1]["filterObject"]
    assert "nucleotideMutations" in variants[2]["filterObject"]
    assert "aminoAcidMutations" in variants[3]["filterObject"]


def test_build_collection_variant_contents():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    variants = col["variants"]
    assert variants[0]["filterObject"]["nucleotideMutations"] == ["C241T", "A23403G"]
    assert variants[1]["filterObject"]["aminoAcidMutations"] == ["S:N501Y"]
    assert variants[2]["filterObject"]["nucleotideMutations"] == ["A23403G"]
    assert variants[3]["filterObject"]["aminoAcidMutations"] == ["S:N501Y"]


def test_build_collection_filters_blank_subs():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["BA.2"])
    # nucSubstitutions has ["C241T", "A23403G", ""] — blank should be dropped
    nuc = col["variants"][0]["filterObject"]["nucleotideMutations"]
    assert "" not in nuc
    assert len(nuc) == 2


def test_build_collection_empty_lists_when_all_blanks():
    col = PangoLineagesSource._build_collection(SAMPLE_DATA["XBB"])
    assert len(col["variants"]) == 4
    for v in col["variants"]:
        lists = list(v["filterObject"].values())
        assert lists == [[]]


# --- get_collections ---


@rsps_lib.activate
def test_get_collections_fetches_data_url():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    PangoLineagesSource().get_collections()
    assert len(rsps_lib.calls) == 1
    assert rsps_lib.calls[0].request.url == DATA_URL


@rsps_lib.activate
def test_get_collections_includes_all_lineages():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = PangoLineagesSource().get_collections()
    # All lineages included regardless of empty subs
    names = [c["name"] for c in cols]
    assert "BA.2" in names
    assert "XBB" in names
    assert "BA.5" in names


@rsps_lib.activate
def test_get_collections_respects_limit():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = PangoLineagesSource(limit=1).get_collections()
    assert len(cols) <= 1


@rsps_lib.activate
def test_get_collections_no_limit_returns_all():
    rsps_lib.add(rsps_lib.GET, DATA_URL, json=SAMPLE_DATA, status=200)
    cols = PangoLineagesSource().get_collections()
    assert len(cols) == 3
