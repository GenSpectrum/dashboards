import requests

from models import Collection, Variant
from sources import Source

DATA_URL = (
    "https://raw.githubusercontent.com/corneliusroemer/pango-sequences"
    "/refs/heads/main/data/pango-consensus-sequences_summary.json"
)


class CovidPangoLineagesSource(Source):
    """Source: Pango lineage definitions from corneliusroemer/pango-sequences.

    Creates one collection per lineage, with nucleotide substitutions as variants.
    """

    name = "covid-pango-lineages"
    organism = "covid"
    owned_tag = "#pango-lineage"

    def __init__(self, limit: int | None = None):
        self._limit = limit

    def get_collections(self) -> list[Collection]:
        print(f"Fetching lineage data from {DATA_URL} ...")
        response = requests.get(DATA_URL, timeout=60)
        response.raise_for_status()
        entries = list(response.json().values())
        if self._limit is not None:
            entries = entries[: self._limit]
        print(f"  Loaded {len(entries)} lineage(s).")
        return [self._build_collection(e) for e in entries]

    def _build_collection(self, entry: dict) -> Collection:
        lineage: str = entry["lineage"]
        parent: str = entry.get("parent") or "—"
        clade: str = entry.get("nextstrainClade") or "—"
        date: str = entry.get("designationDate") or "unknown"

        nuc_subs = [s for s in entry.get("nucSubstitutions", []) if s]
        aa_subs = [s for s in entry.get("aaSubstitutions", []) if s]
        nuc_subs_new = [s for s in entry.get("nucSubstitutionsNew", []) if s]
        aa_subs_new = [s for s in entry.get("aaSubstitutionsNew", []) if s]

        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": "Nucleotide substitutions",
                "filterObject": {"nucleotideMutations": nuc_subs},
            },
            {
                "type": "filterObject",
                "name": "Amino acid substitutions",
                "filterObject": {"aminoAcidMutations": aa_subs},
            },
            {
                "type": "filterObject",
                "name": "New nucleotide substitutions",
                "filterObject": {"nucleotideMutations": nuc_subs_new},
            },
            {
                "type": "filterObject",
                "name": "New amino acid substitutions",
                "filterObject": {"aminoAcidMutations": aa_subs_new},
            },
        ]

        description = (
            f"Pango lineage {lineage}. "
            f"Parent: {parent}. "
            f"Nextstrain clade: {clade}. "
            f"Designated: {date}. "
            f"{self.owned_tag}"
        )

        return {
            "name": lineage,
            "organism": "covid",
            "description": description,
            "variants": variants,
        }


class CovidPangoLineagesSampleSource(CovidPangoLineagesSource):
    """Same as CovidPangoLineagesSource but limited to the first 10 lineages, for quick testing."""

    name = "covid-pango-lineages-sample"
    include_in_default_run = False

    def __init__(self):
        super().__init__(limit=10)
