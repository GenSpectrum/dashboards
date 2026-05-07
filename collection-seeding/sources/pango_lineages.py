"""Source: Pango lineage definitions from corneliusroemer/pango-sequences.

Creates one collection per lineage, with nucleotide substitutions as variants.
"""

import requests

NAME = "covid-pango-lineages"

DATA_URL = (
    "https://raw.githubusercontent.com/corneliusroemer/pango-sequences"
    "/refs/heads/main/data/pango-consensus-sequences_summary.json"
)


def _build_collection(entry: dict) -> dict:
    lineage = entry["lineage"]
    parent = entry.get("parent") or "—"
    clade = entry.get("nextstrainClade") or "—"
    date = entry.get("designationDate") or "unknown"

    subs = [s for s in entry.get("nucSubstitutions", []) if s]
    variants = [
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

    return {
        "name": lineage,
        "organism": "covid",
        "description": description,
        "variants": variants,
    }


def get_collections(limit: int = 0) -> list[dict]:
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
