# example-data

Seeds the backend with example collections (resistance mutation data for 3CLpro, RdRp, and Spike mAb).

The script is idempotent — re-running it will skip collections that already exist.

## Via Docker Compose

The seeder runs automatically as part of Docker Compose:

```bash
BACKEND_TAG=latest WEBSITE_TAG=latest SEEDER_TAG=latest docker compose up
```

## Running locally by hand

Requires a current version of NodeJS. No `npm install` needed.

```bash
# Local backend running on :8080
node seed.mjs

# Local backend on a different port
node seed.mjs --url http://localhost:9021
```

Run `node seed.mjs --help` for all options.
