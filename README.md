# Dashboards

This is a monorepo for the GenSpectrum dashboards.
It contains the following packages:
- `website`: The dashboard website
- `backend`: The backend for the dashboard website


## Local setup

Check the [Docker compose file](docker-compose.yml) for an example on how to run the dashboards Docker images.

Use Docker Compose to run the dashboards:
```bash
BACKEND_TAG=latest WEBSITE_TAG=latest docker compose up
```