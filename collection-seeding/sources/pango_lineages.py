"""Source: Pango lineage definitions from corneliusroemer/pango-sequences.

Creates one collection per lineage, with nucleotide substitutions as variants.
"""

import requests

from models import Collection, Variant

NAME = "covid-pango-lineages"

DATA_URL = (
    "https://raw.githubusercontent.com/corneliusroemer/pango-sequences"
    "/refs/heads/main/data/pango-consensus-sequences_summary.json"
)


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


def get_collections(limit: int = 0) -> list[Collection]:
    print(f"Fetching lineage data from {DATA_URL} ...")
    response = requests.get(DATA_URL, timeout=60)
    response.raise_for_status()
    entries = list(response.json().values())
    if limit:
        entries = entries[:limit]
    print(f"  Loaded {len(entries)} lineage(s).")

    collections = [_build_collection(e) for e in entries]
    # Drop lineages that ended up with no variants after filtering blank subs
    return [c for c in collections if c["variants"]]
