import requests

from models import Collection, Variant
from sources import Source

DATA_URL = "https://viralzone.expasy.org/resources/RSV/F_RSV_human.txt"


def _fetch_rows() -> list[tuple[str, list[str], str, str]]:
    response = requests.get(DATA_URL, timeout=60)
    response.raise_for_status()
    return _parse_rows(response.text)


def _parse_rows(text: str) -> list[tuple[str, list[str], str, str]]:
    """Parse ViralZone RSV resistance text into (rsv_type, aa_mutations, antibody, resistance_type) tuples."""
    rows = []
    for line in text.splitlines():
        tokens = [t.strip() for t in line.split("\t") if t.strip()]
        if len(tokens) < 3 or tokens[0] not in ("A", "B"):
            continue
        rsv_type, aa_str, comment = tokens[0], tokens[1], tokens[2]
        aa_mutations = [f"F:{part}" for part in aa_str.split("+")]
        if "Nirsevimab" in comment:
            antibody = "Nirsevimab"
        elif "Palivizumab" in comment:
            antibody = "Palivizumab"
        else:
            continue
        resistance_type = "Partial resistance" if "Partial resistance" in comment else "Resistance"
        rows.append((rsv_type, aa_mutations, antibody, resistance_type))
    return rows


def _build_collections(rsv_type: str, organism: str, owned_tag: str) -> list[Collection]:
    all_rows = _fetch_rows()
    type_rows = [(aa, ab, res) for (t, aa, ab, res) in all_rows if t == rsv_type]
    collections = []
    for antibody in ("Nirsevimab", "Palivizumab"):
        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": res_type,
                "filterObject": {"aminoAcidMutations": aa},
            }
            for (aa, ab, res_type) in type_rows
            if ab == antibody
        ]
        collections.append({
            "name": f"{antibody} resistance mutations",
            "organism": organism,
            "description": (
                f"RSV F protein resistance mutations against {antibody} "
                f"as per ViralZone (https://viralzone.expasy.org/11605). {owned_tag}"
            ),
            "variants": variants,
        })
    return collections


class RsvAResistanceMutationsSource(Source):
    name = "rsv-a-resistance-mutations"
    organism = "rsv-a"
    owned_tag = "#resistance-mutation"

    def get_collections(self) -> list[Collection]:
        return _build_collections("A", self.organism, self.owned_tag)


class RsvBResistanceMutationsSource(Source):
    name = "rsv-b-resistance-mutations"
    organism = "rsv-b"
    owned_tag = "#resistance-mutation"

    def get_collections(self) -> list[Collection]:
        return _build_collections("B", self.organism, self.owned_tag)
