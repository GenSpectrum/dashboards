#!/usr/bin/env python3
"""Seeds example collections into the backend from one or more data sources.

Idempotent: upserts collections by name — creates new ones, updates existing ones.

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

    active = (
        [source_map[args.source]]
        if args.source
        else [s for s in source_map.values() if s.include_in_default_run]
    )

    try:
        if args.wait:
            client.wait_for_api()

        while True:
            total_created = 0
            total_updated = 0
            total_deleted = 0
            for source in active:
                c, u, d = seed_source(client, source)
                total_created += c
                total_updated += u
                total_deleted += d
            if len(active) > 1:
                print(
                    f"\nTotal — created: {total_created}, updated: {total_updated}, deleted: {total_deleted}."
                )
            if not args.repeat_interval_hours:
                break
            print(f"\nSleeping for {args.repeat_interval_hours}h ...")
            time.sleep(args.repeat_interval_hours * 3600)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def seed_source(client: ApiClient, source: Source) -> tuple[int, int, int]:
    """Upsert collections for one source. Returns (created, updated, deleted) counts.
    Matching is by name — if a collection's name changes in the source, the old entry is orphaned and a new one is created."""
    collections = source.get_collections()
    print(f"\n[{source.name}]")

    # Lenient orphan detection: find owned collections via real tags (new-style) OR
    # description pseudo-tags (old-style), so old collections are found and replaced
    # with properly tagged ones on the first seeder run after migration.
    by_tag = client.fetch_existing_collections_by_tag(source.owned_tag, source.organism)
    all_existing = client.fetch_existing_collections(source.organism)
    by_description = [
        c for c in all_existing if source.owned_tag in (c["description"] or "")
    ]
    all_owned = {c["id"]: c for c in by_tag + by_description}
    existing_by_name = {c["name"]: c for c in all_owned.values()}

    created = 0
    updated = 0
    for collection in collections:
        c, u = _upsert_collection(client, collection, existing_by_name)
        existing_by_name.pop(collection["name"], None)
        created += c
        updated += u

    orphan_ids = [e["id"] for e in existing_by_name.values()]
    deleted = _delete_collections(client, orphan_ids)

    print(f"  Created: {created}, updated: {updated}, deleted: {deleted}.")
    return created, updated, deleted


def _upsert_collection(
    client: ApiClient,
    collection: Collection,
    existing_by_name: dict,
) -> tuple[int, int]:
    existing_entry = existing_by_name.get(collection["name"])
    if existing_entry:
        client.update_collection(existing_entry["id"], collection)
        print(f"  UPDATE id={existing_entry['id']}  {collection['name']}")
        return 0, 1
    else:
        col_id = client.create_collection(collection)
        print(f"  CREATE id={col_id}  {collection['name']}")
        return 1, 0


def _delete_collections(client: ApiClient, collection_ids: list[int]) -> int:
    for col_id in collection_ids:
        client.delete_collection(col_id)
        print(f"  DELETE id={col_id}")
    return len(collection_ids)


def make_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-u",
        "--url",
        default=os.environ.get("API_URL", "http://localhost:4321"),
        help="Website base URL serving /api/* (default: $API_URL or http://localhost:4321)",
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
        default=float(os.environ["REPEAT_INTERVAL_HOURS"])
        if os.environ.get("REPEAT_INTERVAL_HOURS")
        else None,
        metavar="HOURS",
        help="Re-seed every N hours instead of exiting (default: $REPEAT_INTERVAL_HOURS or run once)",
    )
    return parser


if __name__ == "__main__":
    main()
