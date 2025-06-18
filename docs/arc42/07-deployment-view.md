# Deployment View

The dashboards are deployed on the staging and production servers of GenSpectrum.
Every commit builds a Docker image of the backend and the website.
Those Docker images are deployed via Docker compose.

The staging server has the `latest` Docker tag deployed which is built on the `main` branch,
while the production server has the `prod` tag deployed which is built on the `prod` branch.
Deployment happens automatically via [Watchtower](https://github.com/containrrr/watchtower). 
It pulls and starts new images once they are available.
