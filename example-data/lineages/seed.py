#!/usr/bin/env python3
"""Seeds pango lineage collections into the backend.

For each pango lineage definition fetched from the upstream summary JSON,
creates one collection whose variants are the cumulative nucleotide substitutions
that define that lineage.

Idempotent: skips any collection whose name already exists for the seed user.

Run with --help for usage.
"""

import argparse
import sys
import time
import os

import requests

DATA_URL = (
    "https://raw.githubusercontent.com/corneliusroemer/pango-sequences"
    "/refs/heads/main/data/pango-consensus-sequences_summary.json"
)

RETRY_ATTEMPTS = 30
RETRY_DELAY_S = 2
ORGANISM = "covid"
DEFAULT_LIMIT = 10


def parse_args():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-u", "--url",
        default=os.environ.get("BACKEND_URL", "http://localhost:8080"),
        help="Backend base URL (default: $BACKEND_URL or http://localhost:8080)",
    )
    parser.add_argument(
        "--user-id",
        default=os.environ.get("SEED_USER_ID", "example-data-seeder"),
        help="User ID (default: $SEED_USER_ID or example-data-seeder)",
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        default=not sys.stdout.isatty(),
        help="Retry until backend is ready (auto-enabled when no TTY)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        metavar="N",
        help=f"Only process the first N lineages (default: {DEFAULT_LIMIT}; 0 = all)",
    )
    return parser.parse_args()


def fetch_lineages(limit):
    print(f"Fetching lineage data from {DATA_URL} ...")
    response = requests.get(DATA_URL, timeout=60)
    response.raise_for_status()
    data = response.json()
    lineages = list(data.values())
    if limit:
        lineages = lineages[:limit]
    print(f"  Loaded {len(lineages)} lineage(s).")
    return lineages


def build_collection(entry):
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
        "organism": ORGANISM,
        "description": description,
        "variants": variants,
    }


def wait_for_backend(backend_url, user_id):
    url = f"{backend_url}/collections"
    params = {"userId": user_id, "organism": ORGANISM}
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            r = requests.get(url, params=params, timeout=5)
            if r.ok or r.status_code == 404:
                return
        except requests.RequestException:
            pass
        print(f"Waiting for backend... (attempt {attempt}/{RETRY_ATTEMPTS})")
        time.sleep(RETRY_DELAY_S)
    print(f"Backend at {backend_url} did not become ready after {RETRY_ATTEMPTS} attempts.", file=sys.stderr)
    sys.exit(1)


def fetch_existing_collections(backend_url, user_id):
    url = f"{backend_url}/collections"
    params = {"userId": user_id, "organism": ORGANISM}
    r = requests.get(url, params=params, timeout=10)
    if not r.ok:
        raise RuntimeError(f"GET /collections failed: {r.status_code} {r.text}")
    return r.json()


def create_collection(backend_url, user_id, collection):
    url = f"{backend_url}/collections"
    params = {"userId": user_id}
    r = requests.post(url, params=params, json=collection, timeout=10)
    if r.status_code != 201:
        raise RuntimeError(f"POST /collections failed: {r.status_code} {r.text}")
    return r.json()["id"]


def main():
    args = parse_args()
    backend_url = args.url.rstrip("/")
    user_id = args.user_id

    print(f"Seeding pango lineage collections against {backend_url} as user '{user_id}'...")

    if args.wait:
        wait_for_backend(backend_url, user_id)

    lineages = fetch_lineages(args.limit)
    collections = [build_collection(e) for e in lineages if e.get("nucSubstitutions")]
    # Filter out lineages that had no non-empty substitutions
    collections = [c for c in collections if c["variants"]]

    existing = fetch_existing_collections(backend_url, user_id)
    existing_names = {c["name"] for c in existing}

    created = 0
    skipped = 0
    for collection in collections:
        if collection["name"] in existing_names:
            print(f"  SKIP  {collection['name']}")
            skipped += 1
        else:
            col_id = create_collection(backend_url, user_id, collection)
            print(f"  OK    id={col_id}  {collection['name']}")
            created += 1

    print(f"\nDone. Created: {created}, skipped (already exist): {skipped}.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
