import responses as rsps_lib

from sources.covid_pango_lineages import CovidPangoLineagesSource, TREE_URL

# Minimal Nextclade SARS-CoV-2 tree:
#
#   root  B (clade 19A)
#   ├─ NODE_BA     BA   (21M) — nuc: C241T, A21766-  — S: H69-, N501Y
#   │  └─ NODE_BA_2 BA   (21M) — nuc: A100G           (same lineage, mutation within BA)
#   │     └─ NODE_BA2 BA.2 (21L) — nuc: A23403G      — S: D614G
#   │        └─ leaf  BA.2      designation_date 2022-01-20
#   ├─ NODE_XBB    XBB  (no clade) — nuc: T300C
#   └─ NODE_X      B             — nuc: G500T
#      └─ NODE_BA_again BA       — nuc: C241T        (second introduction, deeper)
#         └─ NODE_BA4   BA.4     — nuc: T700C
SAMPLE_TREE = {
    "tree": {
        "name": "root",
        "node_attrs": {
            "Nextclade_pango": {"value": "B"},
            "clade_nextstrain": {"value": "19A"},
        },
        "branch_attrs": {"mutations": {}},
        "children": [
            {
                "name": "NODE_BA",
                "node_attrs": {
                    "Nextclade_pango": {"value": "BA"},
                    "clade_nextstrain": {"value": "21M"},
                },
                "branch_attrs": {
                    "mutations": {
                        "nuc": ["C241T", "A21766-"],
                        "S": ["H69-", "N501Y"],
                    }
                },
                "children": [
                    {
                        "name": "NODE_BA_2",
                        "node_attrs": {
                            "Nextclade_pango": {"value": "BA"},
                            "clade_nextstrain": {"value": "21M"},
                        },
                        "branch_attrs": {"mutations": {"nuc": ["A100G"]}},
                        "children": [
                            {
                                "name": "NODE_BA2",
                                "node_attrs": {
                                    "Nextclade_pango": {"value": "BA.2"},
                                    "clade_nextstrain": {"value": "21L"},
                                    "designation_date": None,
                                },
                                "branch_attrs": {
                                    "mutations": {
                                        "nuc": ["A23403G"],
                                        "S": ["D614G"],
                                    }
                                },
                                "children": [
                                    {
                                        "name": "leaf",
                                        "node_attrs": {
                                            "Nextclade_pango": {"value": "BA.2"},
                                            "designation_date": {"value": "2022-01-20"},
                                        },
                                        "branch_attrs": {},
                                    }
                                ],
                            }
                        ],
                    }
                ],
            },
            {
                "name": "NODE_XBB",
                "node_attrs": {"Nextclade_pango": {"value": "XBB"}},
                "branch_attrs": {"mutations": {"nuc": ["T300C"]}},
            },
            {
                "name": "NODE_X",
                "node_attrs": {"Nextclade_pango": {"value": "B"}},
                "branch_attrs": {"mutations": {"nuc": ["G500T"]}},
                "children": [
                    {
                        "name": "NODE_BA_again",
                        "node_attrs": {"Nextclade_pango": {"value": "BA"}},
                        "branch_attrs": {"mutations": {"nuc": ["C241T"]}},
                        "children": [
                            {
                                "name": "NODE_BA4",
                                "node_attrs": {"Nextclade_pango": {"value": "BA.4"}},
                                "branch_attrs": {"mutations": {"nuc": ["T700C"]}},
                            }
                        ],
                    }
                ],
            },
        ],
    }
}


def _collections(limit=None):
    rsps_lib.add(rsps_lib.GET, TREE_URL, json=SAMPLE_TREE, status=200)
    return {c["name"]: c for c in CovidPangoLineagesSource(limit).get_collections()}


def test_name():
    assert CovidPangoLineagesSource.name == "covid-pango-lineages"


@rsps_lib.activate
def test_get_collections_fetches_tree_url():
    _collections()
    assert len(rsps_lib.calls) == 1
    assert rsps_lib.calls[0].request.url == TREE_URL


@rsps_lib.activate
def test_one_collection_per_lineage():
    cols = _collections()
    assert set(cols) == {"B", "BA", "BA.2", "BA.4", "XBB"}


@rsps_lib.activate
def test_respects_limit():
    assert len(_collections(limit=1)) == 1


@rsps_lib.activate
def test_basic_fields():
    col = _collections()["BA.2"]
    assert col["organism"] == "covid"
    assert col["tags"] == [CovidPangoLineagesSource.owned_tag]


@rsps_lib.activate
def test_description_format():
    col = _collections()["BA.2"]
    assert col["description"] == (
        "Pango lineage BA.2. Parent: BA. Nextstrain clade: 21L. Designated: 2022-01-20."
    )
    assert CovidPangoLineagesSource.owned_tag not in col["description"]


@rsps_lib.activate
def test_description_missing_fields_use_defaults():
    col = _collections()["B"]
    assert col["description"] == (
        "Pango lineage B. Parent: —. Nextstrain clade: 19A. Designated: unknown."
    )
    col = _collections()["XBB"]
    assert "Nextstrain clade: —." in col["description"]


@rsps_lib.activate
def test_variant_names():
    col = _collections()["BA.2"]
    assert [v["name"] for v in col["variants"]] == [
        "Nucleotide substitutions",
        "Amino acid substitutions",
        "New nucleotide substitutions",
        "New amino acid substitutions",
    ]


@rsps_lib.activate
def test_variant_descriptions_with_parent():
    variants = _collections()["BA.2"]["variants"]
    assert (
        variants[0]["description"]
        == "All nucleotide substitutions that define this lineage."
    )
    assert (
        variants[1]["description"]
        == "All amino acid substitutions that define this lineage."
    )
    assert (
        variants[2]["description"]
        == "Nucleotide substitutions not present in the parent lineage (BA)."
    )
    assert (
        variants[3]["description"]
        == "Amino acid substitutions not present in the parent lineage (BA)."
    )


@rsps_lib.activate
def test_variant_descriptions_without_parent():
    variants = _collections()["B"]["variants"]
    assert (
        variants[2]["description"]
        == "Nucleotide substitutions not present in the parent lineage."
    )
    assert "—" not in variants[3]["description"]


@rsps_lib.activate
def test_full_mutations_accumulate_from_root_including_deletions():
    variants = _collections()["BA.2"]["variants"]
    assert variants[0]["filterObject"] == {
        "nucleotideMutations": ["A100G", "C241T", "A21766-", "A23403G"]
    }
    assert variants[1]["filterObject"] == {
        "aminoAcidMutations": ["S:H69-", "S:N501Y", "S:D614G"]
    }


@rsps_lib.activate
def test_new_substitutions_are_relative_to_parent_lineage():
    # A100G happened inside BA's subtree but below BA's introducing node, so it is not
    # part of BA's definition and counts as new for BA.2.
    variants = _collections()["BA.2"]["variants"]
    assert variants[2]["filterObject"] == {"nucleotideMutations": ["A100G", "A23403G"]}
    assert variants[3]["filterObject"] == {"aminoAcidMutations": ["S:D614G"]}


@rsps_lib.activate
def test_lineage_introduced_twice_uses_shallowest_node():
    variants = _collections()["BA"]["variants"]
    assert variants[0]["filterObject"] == {"nucleotideMutations": ["C241T", "A21766-"]}


@rsps_lib.activate
def test_new_substitutions_use_actual_ancestor_introduction():
    # BA.4 sits below the second (not selected) introduction of BA, which carries G500T
    # from the B node above it. Its "new" substitutions must be relative to that
    # introduction, not to the selected BA node elsewhere in the tree (which would
    # wrongly make G500T "new").
    variants = _collections()["BA.4"]["variants"]
    assert variants[0]["filterObject"] == {
        "nucleotideMutations": ["C241T", "G500T", "T700C"]
    }
    assert variants[2]["filterObject"] == {"nucleotideMutations": ["T700C"]}
