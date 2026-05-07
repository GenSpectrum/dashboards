from sources.resistance_mutations import _mature_name, get_collections, NAME


def test_name():
    assert NAME == "covid-resistance-mutations"


# --- _mature_name ---

def test_mature_name_clpro_offset():
    # ORF1a position 3284, offset -3263 → position 21
    assert _mature_name("ORF1a:T3284I", "3CLpro", -3263) == "3CLpro:T21I"


def test_mature_name_rdrp_offset():
    # ORF1b position 157, offset +9 → position 166
    assert _mature_name("ORF1b:V157A", "RdRp", 9) == "RdRp:V166A"


def test_mature_name_spike_zero_offset():
    assert _mature_name("S:E484K", "Spike", 0) == "Spike:E484K"


def test_mature_name_deletion():
    # Deletions use '-' as new base
    assert _mature_name("ORF1a:M3312-", "3CLpro", -3263) == "3CLpro:M49-"


# --- get_collections ---

def test_get_collections_returns_three():
    cols = get_collections()
    assert len(cols) == 3


def test_get_collections_all_covid():
    for col in get_collections():
        assert col["organism"] == "covid"


def test_get_collections_variant_structure():
    for col in get_collections():
        assert col["variants"], f"'{col['name']}' has no variants"
        for v in col["variants"]:
            assert v["type"] == "filterObject"
            assert "aminoAcidMutations" in v["filterObject"]
            assert len(v["filterObject"]["aminoAcidMutations"]) == 1


def test_get_collections_limit_ignored():
    assert get_collections(limit=1) == get_collections(limit=0)
