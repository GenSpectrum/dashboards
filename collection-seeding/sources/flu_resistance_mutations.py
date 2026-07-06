import re
import requests

from models import Collection, Variant
from sources import Source

NA_INHIBITORS_URL = "https://raw.githubusercontent.com/BU-ISCIII/flu_resistance/main/data/NA-inhibitors.json"
PA_INHIBITORS_URL = "https://raw.githubusercontent.com/BU-ISCIII/flu_resistance/main/data/PA-inhibitors.json"

_SOURCE_DESC = (
    "BU-ISCIII flu_resistance database (https://github.com/BU-ISCIII/flu_resistance)"
)

# Resistance level prefix: "RI (10)", "HRI (>1000)", "NI/RI (8-17)", etc.
# Longer alternatives must appear first so the regex engine doesn't greedily match "NI" in "NI/RI".
_RESIST_LEVEL_RE = re.compile(r"^(NI/RI/HRI|NI/RI|RI/HRI|HRI|RI|NI)\b")

# (field_key_prefix, display_name) for each NA inhibitor antiviral
_NA_ANTIVIRALS: list[tuple[str, str]] = [
    ("oseltamivir", "Oseltamivir"),
    ("zanamivir", "Zanamivir"),
    ("peramivir", "Peramivir"),
    ("laninavir", "Laninamivir"),
]


def _parse_resist_level(level_str: str) -> str | None:
    """Return the resistance category prefix from strings like 'RI (10)' or 'HRI (>1000)'.

    Returns None for susceptible (NI-only) or unknown (?, ?e) values.
    """
    if not level_str or level_str in {"?", "?e"}:
        return None
    m = _RESIST_LEVEL_RE.match(level_str.strip())
    if not m:
        return None
    lvl = m.group(1)
    if lvl == "NI":
        return None  # susceptible — not a resistance mutation
    return lvl


def _fetch_json(url: str) -> list[dict]:
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    return response.json()


def _build_na_inhibitor_collections(
    organism: str, strain_names: set[str], owned_tag: str
) -> list[Collection]:
    data = _fetch_json(NA_INHIBITORS_URL)
    rows = [row for row in data if row.get("strain") in strain_names]
    collections: list[Collection] = []

    for field_prefix, antiviral_name in _NA_ANTIVIRALS:
        level_field = f"{field_prefix}_resistance_level"
        variants: list[Variant] = []

        for row in rows:
            level = _parse_resist_level(row.get(level_field, ""))
            if level is None:
                continue
            mutations = row.get("mutation_NA") or []
            if not mutations:
                continue
            variants.append(
                {
                    "type": "filterObject",
                    "name": level,
                    "filterObject": {
                        "aminoAcidMutations": [f"NA:{mut}" for mut in mutations]
                    },
                }
            )

        if not variants:
            continue
        collections.append(
            {
                "name": f"{antiviral_name} resistance mutations",
                "organism": organism,
                "description": (
                    f"Influenza NA resistance mutations against {antiviral_name} "
                    f"as per {_SOURCE_DESC}."
                ),
                "variants": variants,
                "tags": [owned_tag],
            }
        )

    return collections


def _build_pa_inhibitor_collections(
    organism: str, strain_names: set[str], owned_tag: str
) -> list[Collection]:
    data = _fetch_json(PA_INHIBITORS_URL)
    # First entry is a header row — skip it and any row without a real strain
    rows = [
        row
        for row in data
        if row.get("strain") in strain_names
        and row.get("mutation_PA") not in (None, ["Amino acid\nsubstitution"])
    ]

    # TODO: PA-inhibitors.json uses numeric fold-change values only (e.g. "5", "22–54")
    # instead of NI/RI/HRI labels. All non-header rows are included here; a fold-change
    # cutoff for what constitutes clinically relevant resistance has not yet been applied.
    # See QUESTIONS.md for details.
    variants: list[Variant] = []
    for row in rows:
        fc = (row.get("baloxavir_resistance_level") or "").strip()
        mutations = row.get("mutation_PA") or []
        if not fc or not mutations:
            continue
        variants.append(
            {
                "type": "filterObject",
                "name": f"FC {fc}x",
                "filterObject": {
                    "aminoAcidMutations": [f"PA:{mut}" for mut in mutations]
                },
            }
        )

    if not variants:
        return []
    return [
        {
            "name": "Baloxavir resistance mutations",
            "organism": organism,
            "description": (
                f"Influenza PA resistance mutations against Baloxavir (Xofluza) "
                f"as per {_SOURCE_DESC}."
            ),
            "variants": variants,
            "tags": [owned_tag],
        }
    ]


class _FluResistanceMutationsSource(Source):
    """Base class for influenza resistance mutation sources.

    Subclasses set `organism` and `_strain_names` to select matching rows from the
    BU-ISCIII flu_resistance JSON files.
    """

    owned_tag = "resistance-mutation"
    _strain_names: set[str]

    def get_collections(self) -> list[Collection]:
        return _build_na_inhibitor_collections(
            self.organism, self._strain_names, self.owned_tag
        ) + _build_pa_inhibitor_collections(
            self.organism, self._strain_names, self.owned_tag
        )


class FluH1N1ResistanceMutationsSource(_FluResistanceMutationsSource):
    name = "flu-h1n1-resistance-mutations"
    organism = "h1n1pdm"
    # TODO: "A(H1N1)" without "pdm09" suffix refers to pre-2009 seasonal H1N1 —
    # included here for completeness but may warrant a separate organism or exclusion.
    _strain_names = {"A(H1N1)pdm09", "A(H1N1)"}


class FluH3N2ResistanceMutationsSource(_FluResistanceMutationsSource):
    name = "flu-h3n2-resistance-mutations"
    organism = "h3n2"
    # TODO: "A(H3N2)v" denotes zoonotic variant strains — excluded for now.
    _strain_names = {"A(H3N2)"}


class FluH5N1ResistanceMutationsSource(_FluResistanceMutationsSource):
    name = "flu-h5n1-resistance-mutations"
    organism = "h5n1"
    _strain_names = {"A(H5N1)"}


class FluVictoriaResistanceMutationsSource(_FluResistanceMutationsSource):
    name = "flu-victoria-resistance-mutations"
    organism = "victoria"
    # TODO: Both "Type B" and "B" are used in the source files with no lineage
    # distinction (B/Victoria vs B/Yamagata). Since B/Yamagata is no longer circulating
    # these are mapped to victoria, but this should be confirmed.
    _strain_names = {"Type B", "B"}
