# example-data

Seeds the backend with example collections:

- **covid-resistance-mutations** — resistance mutation data for 3CLpro, RdRp, and Spike mAb
- **covid-pango-lineages** — one collection per pango lineage, with nucleotide substitutions as variants

The script is idempotent — re-running it will skip collections that already exist.

## Via Docker Compose

The seeder runs automatically as part of Docker Compose:

```bash
BACKEND_TAG=latest WEBSITE_TAG=latest SEEDER_TAG=latest docker compose up
```

## Running locally

Requires [pixi](https://pixi.sh). Install dependencies once:

```bash
pixi install
```

Then use the provided tasks:

```bash
pixi run seed                    # all sources (resistance mutations + first 10 lineages)
pixi run seed-resistance         # resistance mutations only
pixi run seed-lineages           # pango lineages (first 10)
pixi run seed-all-lineages       # all ~4976 pango lineages
```

To target a different backend:

```bash
pixi run seed --url http://localhost:9021
```

Run `pixi run seed --help` or `pixi run seed <source> --help` for all options.
