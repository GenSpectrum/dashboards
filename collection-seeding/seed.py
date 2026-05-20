#!/usr/bin/env python3
"""Seeds example collections into the backend from one or more data sources.

Idempotent: skips any collection whose name already exists for the seed user.

Run with --help for usage, or <source> --help for source-specific options.
"""

import argparse
import os
import sys
import time

from api import ApiClient
from models import Collection
from sources import Source
from sources.pango_lineages import PangoLineagesSource
from sources.resistance_mutations import ResistanceMutationsSource


def make_parser() -> argparse.ArgumentParser:
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument(
        "-u", "--url",
        default=os.environ.get("API_URL", "http://localhost:4321"),
        help="API base URL (default: $API_URL or http://localhost:4321)",
    )
    parent.add_argument(
        "-k", "--api-key",
        default=os.environ.get("API_KEY"),
        required=not os.environ.get("API_KEY"),
        help="API key for authentication (default: $API_KEY)",
    )
    parent.add_argument(
        "--wait",
        action="store_true",
        default=not sys.stdout.isatty(),
        help="Retry until API is ready (auto-enabled when no TTY)",
    )

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        parents=[parent],
    )
    subparsers = parser.add_subparsers(dest="source", metavar="source")

    subparsers.add_parser(
        ResistanceMutationsSource.name,
        parents=[parent],
        help="Seed SARS-CoV-2 antiviral resistance mutation collections",
    )

    lineages_parser = subparsers.add_parser(
        PangoLineagesSource.name,
        parents=[parent],
        help="Seed pango lineage collections",
    )
    lineages_parser.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Only process the first N lineages (default: all)",
    )

    return parser


def seed_source(client: ApiClient, source: Source) -> tuple[int, int]:
    """Upsert collections for one source, grouped by organism. Returns (created, updated) counts.
    Matching is by name — if a collection's name changes in the source, the old entry is orphaned and a new one is created."""
    collections = source.get_collections()
    print(f"\n[{source.name}]")

    organisms: dict[str, list[Collection]] = {}
    for c in collections:
        organisms.setdefault(c["organism"], []).append(c)

    created = 0
    updated = 0
    for organism, org_collections in organisms.items():
        existing = client.fetch_existing_collections(organism)
        existing_by_name = {c["name"]: c for c in existing}
        for collection in org_collections:
            existing_entry = existing_by_name.get(collection["name"])
            if existing_entry:
                client.update_collection(existing_entry["id"], collection)
                print(f"  UPDATE id={existing_entry['id']}  {collection['name']}")
                updated += 1
            else:
                col_id = client.create_collection(collection)
                print(f"  CREATE id={col_id}  {collection['name']}")
                created += 1

    print(f"  Created: {created}, updated: {updated}.")
    return created, updated


def main():
    parser = make_parser()
    args = parser.parse_args()

    client = ApiClient(args.url, args.api_key)
    print(f"Seeding collections against {args.url} ...")

    if args.wait:
        client.wait_for_api()

    lineage_limit = getattr(args, "limit", None)

    source_map: dict[str, Source] = {
        ResistanceMutationsSource.name: ResistanceMutationsSource(),
        PangoLineagesSource.name: PangoLineagesSource(limit=lineage_limit),
    }
    active = [source_map[args.source]] if args.source else list(source_map.values())

    total_created = 0
    total_updated = 0
    for source in active:
        c, u = seed_source(client, source)
        total_created += c
        total_updated += u

    if len(active) > 1:
        print(f"\nTotal — created: {total_created}, updated: {total_updated}.")


if __name__ == "__main__":
    repeat_hours = os.environ.get("REPEAT_INTERVAL_HOURS")
    while True:
        try:
            main()
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            if not repeat_hours:
                sys.exit(1)
        if not repeat_hours:
            break
        print(f"\nSleeping for {repeat_hours}h ...")
        time.sleep(float(repeat_hours) * 3600)
