from sources.nextclade_tree import extract_clades

# Pango-style tree: lineages are only recorded in node_attrs.Nextclade_pango, there are
# no branch labels. "BA" is introduced twice, at different depths.
#
#   root  (B)
#   ├─ NODE_BA          BA    — nuc: C241T
#   │  └─ NODE_BA_child BA    — nuc: A100G   (same lineage, not yielded)
#   │     └─ NODE_BA2   BA.2  — nuc: G200T
#   └─ NODE_X           B     — nuc: T300C
#      └─ NODE_BA_again BA    — nuc: C241T
PANGO_TREE = {
    "name": "root",
    "node_attrs": {"Nextclade_pango": {"value": "B"}},
    "branch_attrs": {},
    "children": [
        {
            "name": "NODE_BA",
            "node_attrs": {
                "Nextclade_pango": {"value": "BA"},
                "clade_nextstrain": {"value": "21M"},
            },
            "branch_attrs": {"mutations": {"nuc": ["C241T"]}},
            "children": [
                {
                    "name": "NODE_BA_child",
                    "node_attrs": {"Nextclade_pango": {"value": "BA"}},
                    "branch_attrs": {"mutations": {"nuc": ["A100G"]}},
                    "children": [
                        {
                            "name": "NODE_BA2",
                            "node_attrs": {"Nextclade_pango": {"value": "BA.2"}},
                            "branch_attrs": {"mutations": {"nuc": ["G200T"]}},
                        }
                    ],
                }
            ],
        },
        {
            "name": "NODE_X",
            "node_attrs": {"Nextclade_pango": {"value": "B"}},
            "branch_attrs": {"mutations": {"nuc": ["T300C"]}},
            "children": [
                {
                    "name": "NODE_BA_again",
                    "node_attrs": {"Nextclade_pango": {"value": "BA"}},
                    "branch_attrs": {"mutations": {"nuc": ["C241T"]}},
                }
            ],
        },
    ],
}


def test_custom_lineage_attr_yields_introductions():
    clades = list(extract_clades(PANGO_TREE, "Nextclade_pango"))
    assert [c.clade_name for c in clades] == ["B", "BA", "BA.2", "BA"]


def test_custom_lineage_attr_parent():
    clades = list(extract_clades(PANGO_TREE, "Nextclade_pango"))
    ba2 = next(c for c in clades if c.clade_name == "BA.2")
    assert ba2.parent_clade == "BA"


def test_depth():
    clades = list(extract_clades(PANGO_TREE, "Nextclade_pango"))
    assert [c.depth for c in clades] == [0, 1, 3, 2]


def test_node_attrs_are_passed_through():
    clades = list(extract_clades(PANGO_TREE, "Nextclade_pango"))
    ba = clades[1]
    assert ba.node_attrs["clade_nextstrain"]["value"] == "21M"


def test_full_nuc_includes_mutations_within_parent_lineage():
    clades = list(extract_clades(PANGO_TREE, "Nextclade_pango"))
    ba2 = next(c for c in clades if c.clade_name == "BA.2")
    assert ba2.full_nuc == ["A100G", "G200T", "C241T"]
    assert ba2.branch_nuc == ["G200T"]
