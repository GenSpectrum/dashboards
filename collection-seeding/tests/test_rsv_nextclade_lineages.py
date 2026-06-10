import responses as rsps_lib

from sources.rsv_nextclade_lineages import (
    RSV_A_TREE_URL,
    RSV_B_TREE_URL,
    RsvANextcladeLineagesSource,
    RsvBNextcladeLineagesSource,
    _build_collections,
    _extract_clades,
)

# Minimal tree: root → A (clade-introducing) → A.1 (clade-introducing leaf)
SAMPLE_TREE = {
    "tree": {
        "name": "root",
        "node_attrs": {},
        "branch_attrs": {},
        "children": [
            {
                "name": "NODE_A",
                "node_attrs": {"clade_membership": {"value": "A"}},
                "branch_attrs": {
                    "labels": {"clade": "A"},
                    "mutations": {
                        "nuc": ["T59C", "G108A"],
                        "F": ["T8A", "L20F"],
                        "G": ["T4N"],
                    },
                },
                "children": [
                    {
                        "name": "NODE_A1",
                        "node_attrs": {"clade_membership": {"value": "A.1"}},
                        "branch_attrs": {
                            "labels": {"clade": "A.1"},
                            "mutations": {
                                "nuc": ["C241T"],
                                "F": ["K124N"],
                            },
                        },
                        "children": [],
                    },
                    {
                        "name": "leaf_no_clade",
                        "node_attrs": {"clade_membership": {"value": "A"}},
                        "branch_attrs": {
                            "mutations": {"nuc": ["A100G"]},
                        },
                        "children": [],
                    },
                ],
            }
        ],
    }
}


# --- _extract_clades ---


def test_extract_clades_finds_both_clades():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    names = [c[0] for c in clades]
    assert "A" in names
    assert "A.1" in names


def test_extract_clades_skips_non_clade_nodes():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    names = [c[0] for c in clades]
    assert "root" not in names
    assert len(names) == 2


def test_extract_clades_root_clade_has_no_parent():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    root_clade = next(c for c in clades if c[0] == "A")
    assert root_clade[1] is None


def test_extract_clades_child_clade_parent():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    child_clade = next(c for c in clades if c[0] == "A.1")
    assert child_clade[1] == "A"


def test_extract_clades_nuc_mutations():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a_clade = next(c for c in clades if c[0] == "A")
    assert a_clade[2] == ["T59C", "G108A"]


def test_extract_clades_aa_mutations_prefixed_with_gene():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a_clade = next(c for c in clades if c[0] == "A")
    assert "F:T8A" in a_clade[3]
    assert "F:L20F" in a_clade[3]
    assert "G:T4N" in a_clade[3]


def test_extract_clades_no_nuc_in_aa_mutations():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    for _, _, _, aa_muts in clades:
        assert not any(m.startswith("nuc:") for m in aa_muts)


def test_extract_clades_node_without_clade_label_not_yielded():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    # leaf_no_clade has no labels.clade, so it should not appear
    assert len(clades) == 2


# --- _build_collections ---


def test_build_collections_count():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert len(cols) == 2


def test_build_collections_organism():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all(c["organism"] == "rsvA" for c in cols)


def test_build_collections_name_is_clade():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    names = {c["name"] for c in cols}
    assert names == {"A", "A.1"}


def test_build_collections_description_contains_clade_and_parent():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1_col = next(c for c in cols if c["name"] == "A.1")
    assert "A.1" in a1_col["description"]
    assert "A" in a1_col["description"]  # parent


def test_build_collections_description_root_clade_parent_dash():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a_col = next(c for c in cols if c["name"] == "A")
    assert "—" in a_col["description"]


def test_build_collections_description_contains_organism_label():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all("RSV-A" in c["description"] for c in cols)


def test_build_collections_description_contains_owned_tag():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all("#nextclade-lineage" in c["description"] for c in cols)


def test_build_collections_two_variants_per_collection():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all(len(c["variants"]) == 2 for c in cols)


def test_build_collections_variant_names():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    for col in cols:
        names = [v["name"] for v in col["variants"]]
        assert names == ["Nucleotide substitutions", "Amino acid substitutions"]


def test_build_collections_nuc_variant_contents():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a_col = next(c for c in cols if c["name"] == "A")
    nuc_variant = next(v for v in a_col["variants"] if v["name"] == "Nucleotide substitutions")
    assert nuc_variant["filterObject"]["nucleotideMutations"] == ["T59C", "G108A"]


def test_build_collections_aa_variant_contents():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a_col = next(c for c in cols if c["name"] == "A")
    aa_variant = next(v for v in a_col["variants"] if v["name"] == "Amino acid substitutions")
    aa = aa_variant["filterObject"]["aminoAcidMutations"]
    assert "F:T8A" in aa
    assert "F:L20F" in aa
    assert "G:T4N" in aa


# --- source class attributes ---


def test_rsv_a_source_name():
    assert RsvANextcladeLineagesSource.name == "rsv-a-nextclade-lineages"


def test_rsv_b_source_name():
    assert RsvBNextcladeLineagesSource.name == "rsv-b-nextclade-lineages"


def test_rsv_a_organism():
    assert RsvANextcladeLineagesSource.organism == "rsvA"


def test_rsv_b_organism():
    assert RsvBNextcladeLineagesSource.organism == "rsvB"


def test_rsv_a_owned_tag():
    assert RsvANextcladeLineagesSource.owned_tag == "#nextclade-lineage"


def test_rsv_b_owned_tag():
    assert RsvBNextcladeLineagesSource.owned_tag == "#nextclade-lineage"


# --- get_collections (HTTP) ---


@rsps_lib.activate
def test_rsv_a_fetches_correct_url():
    rsps_lib.add(rsps_lib.GET, RSV_A_TREE_URL, json=SAMPLE_TREE, status=200)
    RsvANextcladeLineagesSource().get_collections()
    assert len(rsps_lib.calls) == 1
    assert rsps_lib.calls[0].request.url == RSV_A_TREE_URL


@rsps_lib.activate
def test_rsv_b_fetches_correct_url():
    rsps_lib.add(rsps_lib.GET, RSV_B_TREE_URL, json=SAMPLE_TREE, status=200)
    RsvBNextcladeLineagesSource().get_collections()
    assert len(rsps_lib.calls) == 1
    assert rsps_lib.calls[0].request.url == RSV_B_TREE_URL


@rsps_lib.activate
def test_rsv_a_get_collections_organism():
    rsps_lib.add(rsps_lib.GET, RSV_A_TREE_URL, json=SAMPLE_TREE, status=200)
    cols = RsvANextcladeLineagesSource().get_collections()
    assert all(c["organism"] == "rsvA" for c in cols)


@rsps_lib.activate
def test_rsv_b_get_collections_organism():
    rsps_lib.add(rsps_lib.GET, RSV_B_TREE_URL, json=SAMPLE_TREE, status=200)
    cols = RsvBNextcladeLineagesSource().get_collections()
    assert all(c["organism"] == "rsvB" for c in cols)
