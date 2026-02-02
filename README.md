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
- Influenza A/H3N2
- Influenza A/H1N1pdm
- Influenza B
- Influenza B/Victoria
- West Nile Virus
- RSV-A
- RSV-B
- Mpox
- Ebola Sudan
- Ebola Zaire
- Crimean-Congo Hemorrhagic Fever (CCHF)

The dashboards also allow users to create subscriptions to receive notifications
when there is new data above a configurable threshold for certain variant of an organism.

## Contents

This monorepo contains the following packages:

- [`backend/`](./backend): 
  The backend for additional features of the dashboard website, currently the notification features.

- [`website/`](./website): 
  The dashboard website: delivery of the (basically static, via Astro) HTML pages with the embedded Dashboard Components
  (which are included via npm), 
  which retrieve data from LAPIS instances directly,
  and some additional client side features accessing the backend.


## Local setup

Check the [Docker compose file](docker-compose.yml) for an example on how to run the dashboards Docker images.

Use Docker Compose to run the dashboards:
```bash
BACKEND_TAG=latest WEBSITE_TAG=latest docker compose up
```
