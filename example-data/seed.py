#!/usr/bin/env python3
"""Seeds example collections into the backend from one or more data sources.

Idempotent: skips any collection whose name already exists for the seed user.

Run with --help for usage, or <source> --help for source-specific options.
"""

import argparse
import os
import sys

from backend import BackendClient
from sources import pango_lineages, resistance_mutations

ALL_SOURCES = [resistance_mutations, pango_lineages]
DEFAULT_LINEAGE_LIMIT = 10


def make_parser() -> argparse.ArgumentParser:
    parent = argparse.ArgumentParser(add_help=False)
    parent.add_argument(
        "-u", "--url",
        default=os.environ.get("BACKEND_URL", "http://localhost:8080"),
        help="Backend base URL (default: $BACKEND_URL or http://localhost:8080)",
    )
    parent.add_argument(
        "--wait",
        action="store_true",
        default=not sys.stdout.isatty(),
        help="Retry until backend is ready (auto-enabled when no TTY)",
    )

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        parents=[parent],
    )
    subparsers = parser.add_subparsers(dest="source", metavar="source")

    subparsers.add_parser(
        resistance_mutations.NAME,
        parents=[parent],
        help="Seed SARS-CoV-2 antiviral resistance mutation collections",
    )

    lineages_parser = subparsers.add_parser(
        pango_lineages.NAME,
        parents=[parent],
        help="Seed pango lineage collections",
    )
    lineages_parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LINEAGE_LIMIT,
        metavar="N",
        help=f"Only process the first N lineages (default: {DEFAULT_LINEAGE_LIMIT}; 0 = all)",
    )

    return parser


def seed_source(client: BackendClient, source_name: str, collections: list[dict]):
    print(f"\n[{source_name}]")

    organisms = {}
    for c in collections:
        organisms.setdefault(c["organism"], []).append(c)

    created = 0
    skipped = 0
    for organism, org_collections in organisms.items():
        existing = client.fetch_existing_collections(organism)
        existing_names = {c["name"] for c in existing}
        for collection in org_collections:
            if collection["name"] in existing_names:
                print(f"  SKIP  {collection['name']}")
                skipped += 1
            else:
                col_id = client.create_collection(collection)
                print(f"  OK    id={col_id}  {collection['name']}")
                created += 1

    print(f"  Created: {created}, skipped: {skipped}.")
    return created, skipped


def main():
    parser = make_parser()
    args = parser.parse_args()

    client = BackendClient(args.url)
    print(f"Seeding collections against {args.url} ...")

    if args.wait:
        client.wait_for_backend()  # syncs user as part of polling
    else:
        client.sync_user()

    print(f"Seeding as user id={client.user_id}.")

    lineage_limit = getattr(args, "limit", DEFAULT_LINEAGE_LIMIT)

    if args.source == resistance_mutations.NAME:
        active = [(resistance_mutations, {})]
    elif args.source == pango_lineages.NAME:
        active = [(pango_lineages, {"limit": lineage_limit})]
    else:
        # No subcommand: run all sources
        active = [
            (resistance_mutations, {}),
            (pango_lineages, {"limit": lineage_limit}),
        ]

    total_created = 0
    total_skipped = 0
    for source, kwargs in active:
        collections = source.get_collections(**kwargs)
        c, s = seed_source(client, source.NAME, collections)
        total_created += c
        total_skipped += s

    if len(active) > 1:
        print(f"\nTotal — created: {total_created}, skipped: {total_skipped}.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
