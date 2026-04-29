# example-data

Seeds the backend with example collections (resistance mutation data for 3CLpro, RdRp, and Spike mAb).

The script is idempotent — re-running it will skip collections that already exist.

## Via Docker Compose (staging)

```bash
BACKEND_TAG=latest WEBSITE_TAG=latest docker compose --profile staging up
```

## Running locally by hand

Requires Node 18+. No `npm install` needed.

```bash
# Local backend running on :8080
node seed.js

# Local backend on a different port
node seed.js --url http://localhost:9021

# Staging via session token
# Grab __Secure-authjs.session-token from browser DevTools → Application → Cookies
node seed.js --url https://staging.genspectrum.org --session-token eyJhbG...

# Prod
node seed.js --url https://genspectrum.org --session-token eyJhbG...
```

Run `node seed.js --help` for all options.
