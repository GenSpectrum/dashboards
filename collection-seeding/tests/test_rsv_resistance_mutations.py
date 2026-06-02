import responses as rsps_lib

from sources.rsv_resistance_mutations import (
    DATA_URL,
    RsvAResistanceMutationsSource,
    RsvBResistanceMutationsSource,
    _parse_rows,
)

SAMPLE_TEXT = (
    "#Last update\t14.11.25\n"
    "Type\tAA\t\tComment\n"
    "\n"
    "A\tN67I+N208Y\tNirsevimab Resistance\n"
    "A\tK68E\t\tNirsevimab Partial resistance\t\t\n"
    "A\tK272M\t\tPalivizumab Resistance\n"
    "B\tI64T\t\tNirsevimab Resistance\t\t\n"
    "B\tK65Q\t\tNirsevimab Partial resistance\n"
    "B\tK272Q\t\tPalivizumab Resistance\t\n"
)


# --- _parse_rows ---


def test_parse_rows_single_mutation():
    rows = _parse_rows("B\tI64T\t\tNirsevimab Resistance")
    assert rows == [("B", ["F:I64T"], "Nirsevimab", "Resistance")]


def test_parse_rows_combo_mutation():
    rows = _parse_rows("A\tN67I+N208Y\tNirsevimab Resistance")
    assert rows == [("A", ["F:N67I", "F:N208Y"], "Nirsevimab", "Resistance")]


def test_parse_rows_partial_resistance():
    rows = _parse_rows("A\tK68E\t\tNirsevimab Partial resistance")
    assert rows[0][3] == "Partial resistance"


def test_parse_rows_palivizumab():
    rows = _parse_rows("A\tK272M\t\tPalivizumab Resistance")
    assert rows[0][2] == "Palivizumab"


def test_parse_rows_skips_comment_lines():
    rows = _parse_rows(SAMPLE_TEXT)
    assert all(r[0] in ("A", "B") for r in rows)


def test_parse_rows_skips_header_and_blank_lines():
    rows = _parse_rows(SAMPLE_TEXT)
    assert len(rows) == 6


# --- source names ---


def test_rsv_a_source_name():
    assert RsvAResistanceMutationsSource.name == "rsv-a-resistance-mutations"


def test_rsv_b_source_name():
    assert RsvBResistanceMutationsSource.name == "rsv-b-resistance-mutations"


# --- get_collections ---


@rsps_lib.activate
def test_rsv_a_returns_two_collections():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvAResistanceMutationsSource().get_collections()
    assert len(cols) == 2


@rsps_lib.activate
def test_rsv_a_organism():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvAResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "rsv-a" for c in cols)


@rsps_lib.activate
def test_rsv_b_returns_two_collections():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvBResistanceMutationsSource().get_collections()
    assert len(cols) == 2


@rsps_lib.activate
def test_rsv_b_organism():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvBResistanceMutationsSource().get_collections()
    assert all(c["organism"] == "rsv-b" for c in cols)


@rsps_lib.activate
def test_collection_names_are_nirsevimab_and_palivizumab():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvAResistanceMutationsSource().get_collections()
    names = {c["name"] for c in cols}
    assert names == {"Nirsevimab resistance mutations", "Palivizumab resistance mutations"}


@rsps_lib.activate
def test_variant_names_are_resistance_types():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvAResistanceMutationsSource().get_collections()
    for col in cols:
        for v in col["variants"]:
            assert v["name"] in ("Resistance", "Partial resistance")


@rsps_lib.activate
def test_variants_have_amino_acid_mutations():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvBResistanceMutationsSource().get_collections()
    for col in cols:
        for v in col["variants"]:
            assert "aminoAcidMutations" in v["filterObject"]
            assert len(v["filterObject"]["aminoAcidMutations"]) >= 1


@rsps_lib.activate
def test_combo_mutation_produces_multiple_aa_entries():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvAResistanceMutationsSource().get_collections()
    nirsevimab_col = next(c for c in cols if "Nirsevimab" in c["name"])
    combo_variant = next(
        v for v in nirsevimab_col["variants"]
        if len(v["filterObject"]["aminoAcidMutations"]) > 1
    )
    assert combo_variant["filterObject"]["aminoAcidMutations"] == ["F:N67I", "F:N208Y"]


@rsps_lib.activate
def test_only_rsv_b_rows_in_rsv_b_collections():
    rsps_lib.add(rsps_lib.GET, DATA_URL, body=SAMPLE_TEXT, status=200)
    cols = RsvBResistanceMutationsSource().get_collections()
    # RSV-B Nirsevimab should have I64T and K65Q (not A's K68E)
    nirsevimab_col = next(c for c in cols if "Nirsevimab" in c["name"])
    all_aa = [
        aa
        for v in nirsevimab_col["variants"]
        for aa in v["filterObject"]["aminoAcidMutations"]
    ]
    assert "F:I64T" in all_aa
    assert "F:K65Q" in all_aa
    assert "F:K68E" not in all_aa  # RSV-A only
