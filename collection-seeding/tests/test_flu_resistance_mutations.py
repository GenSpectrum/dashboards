import json
import responses as rsps_lib

from sources.flu_resistance_mutations import (
    NA_INHIBITORS_URL,
    PA_INHIBITORS_URL,
    FluH1N1ResistanceMutationsSource,
    FluH3N2ResistanceMutationsSource,
    FluH5N1ResistanceMutationsSource,
    FluVictoriaResistanceMutationsSource,
    _parse_resist_level,
)

# --- Minimal NA-inhibitors fixture ----------------------------------------

NA_SAMPLE: list[dict] = [
    {
        "strain": "A(H1N1)pdm09",
        "mutation_NA": ["H275Y"],
        "N2": ["274"],
        "oseltamivir_resistance_level": "HRI (>1000)",
        "zanamivir_resistance_level": "NI (1)",
        "peramivir_resistance_level": "HRI (>10000)",
        "laninavir_resistance_level": "NI (1)",
        "references": ["(1)"],
    },
    {
        "strain": "A(H1N1)pdm09",
        "mutation_NA": ["I223R"],
        "N2": ["222"],
        "oseltamivir_resistance_level": "RI (40)",
        "zanamivir_resistance_level": "NI/RI (3-8)",
        "peramivir_resistance_level": "RI (20)",
        "laninavir_resistance_level": "?",
        "references": ["(2)"],
    },
    {
        "strain": "A(H3N2)",
        "mutation_NA": ["E119V"],
        "N2": ["119"],
        "oseltamivir_resistance_level": "HRI (>1000)",
        "zanamivir_resistance_level": "NI (1)",
        "peramivir_resistance_level": "HRI (>200)",
        "laninavir_resistance_level": "?",
        "references": ["(3)"],
    },
    {
        "strain": "A(H5N1)",
        "mutation_NA": ["H275Y"],
        "N2": ["274"],
        "oseltamivir_resistance_level": "HRI (>1000)",
        "zanamivir_resistance_level": "NI (1)",
        "peramivir_resistance_level": "HRI (>10000)",
        "laninavir_resistance_level": "?",
        "references": ["(4)"],
    },
    {
        "strain": "Type B",
        "mutation_NA": ["H273Y"],
        "N2": ["274"],
        "oseltamivir_resistance_level": "HRI (>1000)",
        "zanamivir_resistance_level": "NI (1)",
        "peramivir_resistance_level": "HRI (>200)",
        "laninavir_resistance_level": "NI (1)",
        "references": ["(5)"],
    },
    {
        "strain": "A(H7N9)",
        "mutation_NA": ["R292K"],
        "N2": ["292"],
        "oseltamivir_resistance_level": "HRI (>1000)",
        "zanamivir_resistance_level": "RI (10)",
        "peramivir_resistance_level": "HRI (>1000)",
        "laninavir_resistance_level": "?",
        "references": ["(6)"],
    },
]

# --- Minimal PA-inhibitors fixture ----------------------------------------

PA_SAMPLE: list[dict] = [
    {
        "strain": "",
        "mutation_PA": ["Amino acid\nsubstitution"],
        "baloxavir_resistance_level": "Baloxavir susceptibility by\nphenotypic assay\n(EC50 fold-change)a",
        "source_virus": "Source of virusesb",
        "references": ["References"],
    },
    {
        "strain": "A(H1N1)pdm09",
        "mutation_PA": ["I38T"],
        "baloxavir_resistance_level": "49",
        "source_virus": "RG",
        "references": ["(1)"],
    },
    {
        "strain": "A(H3N2)",
        "mutation_PA": ["I38T"],
        "baloxavir_resistance_level": "35",
        "source_virus": "Sur",
        "references": ["(2)"],
    },
    {
        "strain": "B",
        "mutation_PA": ["I38T"],
        "baloxavir_resistance_level": "22",
        "source_virus": "Sur",
        "references": ["(3)"],
    },
]


def _mock_both(rsps):
    rsps.add(rsps_lib.GET, NA_INHIBITORS_URL, body=json.dumps(NA_SAMPLE), status=200)
    rsps.add(rsps_lib.GET, PA_INHIBITORS_URL, body=json.dumps(PA_SAMPLE), status=200)


# --- _parse_resist_level ---------------------------------------------------


def test_parse_hri():
    assert _parse_resist_level("HRI (>1000)") == "HRI"


def test_parse_ri():
    assert _parse_resist_level("RI (40)") == "RI"


def test_parse_ni_returns_none():
    assert _parse_resist_level("NI (1)") is None


def test_parse_ni_slash_ri():
    assert _parse_resist_level("NI/RI (3-8)") == "NI/RI"


def test_parse_ri_slash_hri():
    assert _parse_resist_level("RI/HRI (100-500)") == "RI/HRI"


def test_parse_question_mark_returns_none():
    assert _parse_resist_level("?") is None


def test_parse_question_mark_e_returns_none():
    assert _parse_resist_level("?e") is None


def test_parse_empty_returns_none():
    assert _parse_resist_level("") is None


# --- source names ----------------------------------------------------------


def test_h1n1_source_name():
    assert FluH1N1ResistanceMutationsSource.name == "flu-h1n1-resistance-mutations"


def test_h3n2_source_name():
    assert FluH3N2ResistanceMutationsSource.name == "flu-h3n2-resistance-mutations"


def test_h5n1_source_name():
    assert FluH5N1ResistanceMutationsSource.name == "flu-h5n1-resistance-mutations"


def test_victoria_source_name():
    assert (
        FluVictoriaResistanceMutationsSource.name == "flu-victoria-resistance-mutations"
    )


# --- organism values -------------------------------------------------------


@rsps_lib.activate
def test_h1n1_organism():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "h1n1pdm" for c in cols)


@rsps_lib.activate
def test_h3n2_organism():
    _mock_both(rsps_lib)
    cols = FluH3N2ResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "h3n2" for c in cols)


@rsps_lib.activate
def test_h5n1_organism():
    _mock_both(rsps_lib)
    cols = FluH5N1ResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "h5n1" for c in cols)


@rsps_lib.activate
def test_victoria_organism():
    _mock_both(rsps_lib)
    cols = FluVictoriaResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "victoria" for c in cols)


# --- NA inhibitor collections ----------------------------------------------


@rsps_lib.activate
def test_h1n1_has_oseltamivir_collection():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    names = [c["name"] for c in cols]
    assert "Oseltamivir resistance mutations" in names


@rsps_lib.activate
def test_ni_only_mutations_are_excluded():
    """Zanamivir for H1N1 H275Y is NI — should not appear as a variant."""
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    zana_col = next((c for c in cols if "Zanamivir" in c["name"]), None)
    if zana_col is not None:
        all_muts = [
            aa
            for v in zana_col["variants"]
            for aa in v["filterObject"]["aminoAcidMutations"]
        ]
        assert "NA:H275Y" not in all_muts


@rsps_lib.activate
def test_hri_mutation_included():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    ose_col = next(c for c in cols if "Oseltamivir" in c["name"])
    all_muts = [
        aa
        for v in ose_col["variants"]
        for aa in v["filterObject"]["aminoAcidMutations"]
    ]
    assert "NA:H275Y" in all_muts


@rsps_lib.activate
def test_ri_mutation_included():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    ose_col = next(c for c in cols if "Oseltamivir" in c["name"])
    all_muts = [
        aa
        for v in ose_col["variants"]
        for aa in v["filterObject"]["aminoAcidMutations"]
    ]
    assert "NA:I223R" in all_muts


@rsps_lib.activate
def test_variant_name_is_resistance_level():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    ose_col = next(c for c in cols if "Oseltamivir" in c["name"])
    names = {v["name"] for v in ose_col["variants"]}
    assert names <= {"NI", "RI", "HRI", "NI/RI", "RI/HRI", "NI/RI/HRI"}


@rsps_lib.activate
def test_mutations_prefixed_with_na():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    for col in cols:
        if "Baloxavir" in col["name"]:
            continue  # PA mutations checked separately
        for v in col["variants"]:
            for aa in v["filterObject"]["aminoAcidMutations"]:
                assert aa.startswith("NA:"), f"Expected NA: prefix, got {aa!r}"


@rsps_lib.activate
def test_unknown_strain_excluded():
    """A(H7N9) is not a dashboard organism and should not appear in any collection."""
    _mock_both(rsps_lib)
    for Source in (
        FluH1N1ResistanceMutationsSource,
        FluH3N2ResistanceMutationsSource,
        FluH5N1ResistanceMutationsSource,
        FluVictoriaResistanceMutationsSource,
    ):
        cols = Source().get_collections()
        all_muts = [
            aa
            for c in cols
            for v in c["variants"]
            for aa in v["filterObject"]["aminoAcidMutations"]
        ]
        assert "NA:R292K" not in all_muts or Source.organism == "h7n9", (
            f"H7N9 mutation should not appear in {Source.name}"
        )


# --- PA inhibitor (Baloxavir) collections ----------------------------------


@rsps_lib.activate
def test_h1n1_has_baloxavir_collection():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    names = [c["name"] for c in cols]
    assert "Baloxavir resistance mutations" in names


@rsps_lib.activate
def test_baloxavir_mutations_prefixed_with_pa():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    bal_col = next(c for c in cols if "Baloxavir" in c["name"])
    for v in bal_col["variants"]:
        for aa in v["filterObject"]["aminoAcidMutations"]:
            assert aa.startswith("PA:"), f"Expected PA: prefix, got {aa!r}"


@rsps_lib.activate
def test_baloxavir_variant_name_is_mutation():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    bal_col = next(c for c in cols if "Baloxavir" in c["name"])
    for v in bal_col["variants"]:
        assert v["name"].startswith("PA:"), (
            f"Expected variant named by mutation, got {v['name']!r}"
        )


@rsps_lib.activate
def test_baloxavir_variant_description_contains_fold_change():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    bal_col = next(c for c in cols if "Baloxavir" in c["name"])
    for v in bal_col["variants"]:
        assert "fold-change" in v.get("description", "").lower(), (
            f"Expected description with fold-change info, got {v.get('description')!r}"
        )


@rsps_lib.activate
def test_pa_header_row_excluded():
    """The first PA-inhibitors entry is a header row and must not produce a variant."""
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    bal_col = next(c for c in cols if "Baloxavir" in c["name"])
    all_muts = [
        aa
        for v in bal_col["variants"]
        for aa in v["filterObject"]["aminoAcidMutations"]
    ]
    assert not any("substitution" in aa.lower() for aa in all_muts)


@rsps_lib.activate
def test_variant_structure():
    _mock_both(rsps_lib)
    cols = FluH1N1ResistanceMutationsSource().get_collections()
    for col in cols:
        for v in col["variants"]:
            assert v["type"] == "filterObject"
            assert "aminoAcidMutations" in v["filterObject"]
            assert len(v["filterObject"]["aminoAcidMutations"]) >= 1
