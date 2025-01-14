# Dashboards

> The GenSpectrum dashboards are interactive dashboards for the analysis of pathogen genomic data.
> 
> Visit it: https://genspectrum.org

The dashboards visualize genomic data obtained from several [LAPIS](https://github.com/GenSpectrum/LAPIS) instances.
They utilize the [Dashboard Components](https://github.com/GenSpectrum/dashboard-components) library.
Currently, we support the following organisms:
- SARS-CoV-2
- Influenza A
- Influenza A/H5N1
- West Nile Virus
- RSV-A
- RSV-B

The dashboards also allow users to create subscriptions to receive notifications
when there is new data above a configurable threshold for certain variant of an organism.

## Contents

This monorepo contains the following packages:
- [`website/`](./website): The dashboard website
- [`backend/`](./backend): The backend for the dashboard website


## Local setup

Check the [Docker compose file](docker-compose.yml) for an example on how to run the dashboards Docker images.

Use Docker Compose to run the dashboards:
```bash
BACKEND_TAG=latest WEBSITE_TAG=latest docker compose up
```