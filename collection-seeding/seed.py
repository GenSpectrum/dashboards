#!/usr/bin/env python3
"""Seeds example collections into the backend from one or more data sources.

Idempotent: skips any collection whose name already exists for the seed user.

Run with --help for usage.
"""

import argparse
import os
import sys
import time

from api import ApiClient
from models import Collection
from sources import Source
from sources.registry import ALL_SOURCES


def main():
    parser = make_parser()
    args = parser.parse_args()

    source_map = {cls.name: cls() for cls in ALL_SOURCES}

    if args.list:
        for name in source_map:
            print(name)
        return

    if args.source and args.source not in source_map:
        print(
            f"Unknown source '{args.source}'. Use --list to see available sources.",
            file=sys.stderr,
        )
        sys.exit(1)

    if not args.api_key:
        print("Error: --api-key is required (or set $API_KEY).", file=sys.stderr)
        sys.exit(1)

    client = ApiClient(args.url, args.api_key)
    print(f"Seeding collections against {args.url} ...")

    active = [source_map[args.source]] if args.source else list(source_map.values())

    try:
        if args.wait:
            client.wait_for_api()

        while True:
            total_created = 0
            total_updated = 0
            for source in active:
                c, u = seed_source(client, source)
                total_created += c
                total_updated += u
            if len(active) > 1:
                print(f"\nTotal — created: {total_created}, updated: {total_updated}.")
            if not args.repeat_interval_hours:
                break
            print(f"\nSleeping for {args.repeat_interval_hours}h ...")
            time.sleep(args.repeat_interval_hours * 3600)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


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


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-u",
        "--url",
        default=os.environ.get("API_URL", "http://localhost:4321"),
        help="API base URL (default: $API_URL or http://localhost:4321)",
    )
    parser.add_argument(
        "-k",
        "--api-key",
        default=os.environ.get("API_KEY"),
        help="API key for authentication (default: $API_KEY)",
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        default=not sys.stdout.isatty(),
        help="Retry until API is ready (auto-enabled when no TTY)",
    )
    parser.add_argument(
        "--source",
        metavar="NAME",
        help="Only run this source (default: all). Use --list to see available sources.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available sources and exit",
    )
    parser.add_argument(
        "--repeat-interval-hours",
        type=float,
        default=os.environ.get("REPEAT_INTERVAL_HOURS"),
        metavar="HOURS",
        help="Re-seed every N hours instead of exiting (default: $REPEAT_INTERVAL_HOURS or run once)",
    )
    return parser


if __name__ == "__main__":
    main()
