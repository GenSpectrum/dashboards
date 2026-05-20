"""Source: Pango lineage definitions from corneliusroemer/pango-sequences.

Creates one collection per lineage, with nucleotide substitutions as variants.
"""

import requests

from models import Collection, Variant
from sources import Source

DATA_URL = (
    "https://raw.githubusercontent.com/corneliusroemer/pango-sequences"
    "/refs/heads/main/data/pango-consensus-sequences_summary.json"
)

DEFAULT_LIMIT = 0


class PangoLineagesSource(Source):
    name = "covid-pango-lineages"

    def __init__(self, limit: int = DEFAULT_LIMIT):
        self._limit = limit

    def get_collections(self) -> list[Collection]:
        print(f"Fetching lineage data from {DATA_URL} ...")
        response = requests.get(DATA_URL, timeout=60)
        response.raise_for_status()
        entries = list(response.json().values())
        if self._limit:
            entries = entries[:self._limit]
        print(f"  Loaded {len(entries)} lineage(s).")
        collections = [self._build_collection(e) for e in entries]
        # Drop lineages that ended up with no variants after filtering blank subs
        return [c for c in collections if c["variants"]]

    @staticmethod
    def _build_collection(entry: dict) -> Collection:
        lineage: str = entry["lineage"]
        parent: str = entry.get("parent") or "—"
        clade: str = entry.get("nextstrainClade") or "—"
        date: str = entry.get("designationDate") or "unknown"

        subs = [s for s in entry.get("nucSubstitutions", []) if s]
        variants: list[Variant] = [
            {
                "type": "filterObject",
                "name": sub,
                "filterObject": {"nucleotideMutations": [sub]},
            }
            for sub in subs
        ]

        description = (
            f"Pango lineage {lineage}. "
            f"Parent: {parent}. "
            f"Nextstrain clade: {clade}. "
            f"Designated: {date}."
        )

        return Collection(
            name=lineage,
            organism="covid",
            description=description,
            variants=variants,
        )
