import responses as rsps_lib

from sources.rsv_nextclade_lineages import (
    RSV_A_TREE_URL,
    RSV_B_TREE_URL,
    RsvANextcladeLineagesSource,
    RsvBNextcladeLineagesSource,
    _apply_aa_mutations,
    _apply_nuc_mutations,
    _build_collections,
    _extract_clades,
)

# Minimal tree used by most tests:
#
#   root (no clade)
#   └─ NODE_A  introduces clade "A"  — nuc: T59C, G108A  — aa F: T8A, L20F  G: T4N
#      ├─ NODE_A1  introduces clade "A.1"  — nuc: C241T  — aa F: K124N
#      └─ leaf_no_clade  (clade_membership=A, no labels.clade — not yielded)
#
# Expected accumulated mutations:
#   A:    full_nuc=["T59C", "G108A"],   full_aa=["F:T8A", "F:L20F", "G:T4N"]
#   A.1:  full_nuc=["T59C", "G108A", "C241T"],  full_aa=["F:T8A", "F:L20F", "G:T4N", "F:K124N"]
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


# --- _apply_nuc_mutations ---


def test_apply_nuc_first_mutation_records_ref_base():
    # Position 982 not previously mutated → parent base C is the reference base.
    result = _apply_nuc_mutations(["C982T"], {})
    assert result == {"982": ("C", "T")}


def test_apply_nuc_second_mutation_keeps_original_ref_base():
    # Position 982 was previously mutated A→C; now mutated C→T.
    # The reference base should remain A (not C).
    result = _apply_nuc_mutations(["C982T"], {"982": ("A", "C")})
    assert result == {"982": ("A", "T")}


def test_apply_nuc_two_hops_ref_base_is_always_original():
    # Position 100: first branch A→C, second branch C→T.
    # The accumulated entry should be A100T — reference base A, not the intermediate C.
    after_first = _apply_nuc_mutations(["A100C"], {})
    after_second = _apply_nuc_mutations(["C100T"], after_first)
    assert after_second == {"100": ("A", "T")}


def test_apply_nuc_reversion_removes_position():
    # Position 982 was mutated A→C; now reverted C→A.
    # Net effect from reference is zero — position should be removed.
    result = _apply_nuc_mutations(["C982A"], {"982": ("A", "C")})
    assert "982" not in result


def test_apply_nuc_does_not_mutate_input():
    accum = {"59": ("T", "C")}
    _apply_nuc_mutations(["G108A"], accum)
    assert "108" not in accum  # original dict unchanged


def test_apply_nuc_multiple_mutations():
    result = _apply_nuc_mutations(["T59C", "G108A"], {})
    assert result == {"59": ("T", "C"), "108": ("G", "A")}


# --- _apply_aa_mutations ---


def test_apply_aa_first_mutation():
    result = _apply_aa_mutations({"F": ["T8A"]}, {})
    assert result == {("F", "8"): ("T", "A")}


def test_apply_aa_second_mutation_keeps_original_ref():
    # F codon 8 was previously mutated T→A; now mutated A→G.
    result = _apply_aa_mutations({"F": ["A8G"]}, {("F", "8"): ("T", "A")})
    assert result == {("F", "8"): ("T", "G")}


def test_apply_aa_reversion_removes_entry():
    result = _apply_aa_mutations({"F": ["A8T"]}, {("F", "8"): ("T", "A")})
    assert ("F", "8") not in result


def test_apply_aa_does_not_mutate_input():
    accum = {("F", "8"): ("T", "A")}
    _apply_aa_mutations({"G": ["T4N"]}, accum)
    assert ("G", "4") not in accum


def test_apply_aa_multiple_genes():
    result = _apply_aa_mutations({"F": ["T8A"], "G": ["T4N"]}, {})
    assert result == {("F", "8"): ("T", "A"), ("G", "4"): ("T", "N")}


# --- _extract_clades ---


def test_extract_clades_finds_both_clades():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    names = [c[0] for c in clades]
    assert "A" in names
    assert "A.1" in names


def test_extract_clades_skips_non_clade_nodes():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    assert len(clades) == 2


def test_extract_clades_root_clade_has_no_parent():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    root_clade = next(c for c in clades if c[0] == "A")
    assert root_clade[1] is None


def test_extract_clades_child_clade_parent():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    child = next(c for c in clades if c[0] == "A.1")
    assert child[1] == "A"


def test_extract_clades_branch_nuc_is_this_branch_only():
    # branch_nuc (index 2) should contain only the mutations on that specific branch.
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a1 = next(c for c in clades if c[0] == "A.1")
    assert a1[2] == ["C241T"]  # only what's new in A.1, not A's mutations


def test_extract_clades_branch_aa_is_this_branch_only():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a1 = next(c for c in clades if c[0] == "A.1")
    assert a1[3] == ["F:K124N"]


def test_extract_clades_full_nuc_accumulates_from_root():
    # full_nuc (index 4) for A.1 must include A's mutations as well as A.1's own.
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a1 = next(c for c in clades if c[0] == "A.1")
    assert set(a1[4]) == {"T59C", "G108A", "C241T"}


def test_extract_clades_full_nuc_root_clade_equals_branch():
    # For the root clade (A) there is no ancestor, so full == branch.
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a = next(c for c in clades if c[0] == "A")
    assert set(a[4]) == {"T59C", "G108A"}


def test_extract_clades_full_aa_accumulates_from_root():
    clades = list(_extract_clades(SAMPLE_TREE["tree"]))
    a1 = next(c for c in clades if c[0] == "A.1")
    assert set(a1[5]) == {"F:T8A", "F:L20F", "G:T4N", "F:K124N"}


def test_extract_clades_sibling_subtrees_do_not_share_state():
    # Add a second child of A that mutates position 59 again (T59C was A's mutation).
    # This sibling should not see a "reverted" position 59 from the other sibling.
    tree = {
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
                        "mutations": {"nuc": ["T59C"]},
                    },
                    "children": [
                        {
                            "name": "NODE_A1",
                            "node_attrs": {"clade_membership": {"value": "A.1"}},
                            "branch_attrs": {
                                "labels": {"clade": "A.1"},
                                "mutations": {"nuc": ["C241T"]},
                            },
                            "children": [],
                        },
                        {
                            "name": "NODE_A2",
                            "node_attrs": {"clade_membership": {"value": "A.2"}},
                            "branch_attrs": {
                                "labels": {"clade": "A.2"},
                                "mutations": {"nuc": ["G300T"]},
                            },
                            "children": [],
                        },
                    ],
                }
            ],
        }
    }
    clades = {c[0]: c for c in _extract_clades(tree["tree"])}
    # A.1 and A.2 should each independently see T59C from A
    assert "T59C" in clades["A.1"][4]
    assert "T59C" in clades["A.2"][4]
    # A.1 should NOT see A.2's mutation and vice versa
    assert "G300T" not in clades["A.1"][4]
    assert "C241T" not in clades["A.2"][4]


def test_extract_clades_multi_hop_accumulation():
    # Position 100: A→C in clade A, then C→G in clade A.1.
    # full_nuc for A.1 should report it as A100G (from reference A to final G).
    tree = {
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
                        "mutations": {"nuc": ["A100C"]},
                    },
                    "children": [
                        {
                            "name": "NODE_A1",
                            "node_attrs": {"clade_membership": {"value": "A.1"}},
                            "branch_attrs": {
                                "labels": {"clade": "A.1"},
                                "mutations": {"nuc": ["C100G"]},
                            },
                            "children": [],
                        }
                    ],
                }
            ],
        }
    }
    clades = {c[0]: c for c in _extract_clades(tree["tree"])}
    assert "A100C" in clades["A"][4]
    assert "A100G" in clades["A.1"][4]   # reference A, final G
    assert "A100C" not in clades["A.1"][4]  # A's intermediate step not present


def test_extract_clades_reversion_removed_from_full():
    # Position 100: A→C in clade A, then C→A (reversion) in clade A.1.
    # A.1's full_nuc should NOT contain position 100 (net effect is zero).
    tree = {
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
                        "mutations": {"nuc": ["A100C"]},
                    },
                    "children": [
                        {
                            "name": "NODE_A1",
                            "node_attrs": {"clade_membership": {"value": "A.1"}},
                            "branch_attrs": {
                                "labels": {"clade": "A.1"},
                                "mutations": {"nuc": ["C100A"]},
                            },
                            "children": [],
                        }
                    ],
                }
            ],
        }
    }
    clades = {c[0]: c for c in _extract_clades(tree["tree"])}
    full_nuc_a1 = clades["A.1"][4]
    assert not any("100" in m for m in full_nuc_a1)


# --- _build_collections ---


def test_build_collections_count():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert len(cols) == 2


def test_build_collections_organism():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all(c["organism"] == "rsvA" for c in cols)


def test_build_collections_name_is_clade():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert {c["name"] for c in cols} == {"A", "A.1"}


def test_build_collections_description_contains_clade_and_parent():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1 = next(c for c in cols if c["name"] == "A.1")
    assert "A.1" in a1["description"]
    assert "A" in a1["description"]


def test_build_collections_description_root_clade_parent_dash():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a = next(c for c in cols if c["name"] == "A")
    assert "—" in a["description"]


def test_build_collections_description_contains_organism_label():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all("RSV-A" in c["description"] for c in cols)


def test_build_collections_description_contains_owned_tag():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all("#nextclade-lineage" in c["description"] for c in cols)


def test_build_collections_four_variants_per_collection():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    assert all(len(c["variants"]) == 4 for c in cols)


def test_build_collections_variant_names():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    for col in cols:
        names = [v["name"] for v in col["variants"]]
        assert names == [
            "Nucleotide substitutions",
            "Amino acid substitutions",
            "New nucleotide substitutions",
            "New amino acid substitutions",
        ]


def test_build_collections_full_nuc_variant_contents():
    # "Nucleotide substitutions" = full set from reference root.
    # For A.1 this includes A's mutations plus A.1's own.
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1 = next(c for c in cols if c["name"] == "A.1")
    full_nuc = next(v for v in a1["variants"] if v["name"] == "Nucleotide substitutions")
    assert set(full_nuc["filterObject"]["nucleotideMutations"]) == {"T59C", "G108A", "C241T"}


def test_build_collections_new_nuc_variant_contents():
    # "New nucleotide substitutions" = branch-only, just what A.1 introduces.
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1 = next(c for c in cols if c["name"] == "A.1")
    new_nuc = next(v for v in a1["variants"] if v["name"] == "New nucleotide substitutions")
    assert new_nuc["filterObject"]["nucleotideMutations"] == ["C241T"]


def test_build_collections_full_aa_variant_contents():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1 = next(c for c in cols if c["name"] == "A.1")
    full_aa = next(v for v in a1["variants"] if v["name"] == "Amino acid substitutions")
    assert set(full_aa["filterObject"]["aminoAcidMutations"]) == {"F:T8A", "F:L20F", "G:T4N", "F:K124N"}


def test_build_collections_new_aa_variant_contents():
    cols = _build_collections(SAMPLE_TREE, "rsvA", "RSV-A", "#nextclade-lineage")
    a1 = next(c for c in cols if c["name"] == "A.1")
    new_aa = next(v for v in a1["variants"] if v["name"] == "New amino acid substitutions")
    assert new_aa["filterObject"]["aminoAcidMutations"] == ["F:K124N"]


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
    assert rsps_lib.calls[0].request.url == RSV_A_TREE_URL


@rsps_lib.activate
def test_rsv_b_fetches_correct_url():
    rsps_lib.add(rsps_lib.GET, RSV_B_TREE_URL, json=SAMPLE_TREE, status=200)
    RsvBNextcladeLineagesSource().get_collections()
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
