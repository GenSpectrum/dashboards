# Solution Strategy

We decided to use Astro and React for the frontend.
Astro comes with a server application that is deployed to our servers.
Thus, we don't need a separate infrastructure that serves files for the frontend,
and we can use it as a proxy for the backend.
Where more interactivity is needed, we use React components within the static Astro pages.

For data visualization, we use the [GenSpectrum Dashboards Components](https://github.com/GenSpectrum/dashboard-components).
Every organism that the dashboards support has several pages that are composed of dashboard components
to support a certain view on the data.
A filter section lets the user specify which data should be considered.
The filter is persisted in the URL as query parameters so that users can share the current view with others or bookmark it.

The backend is a Spring Boot application that provides a REST API. Data is stored in a PostgreSQL database.
The backend was developed to support the subscriptions features of the dashboards.
The subscriptions are stored in the database and can be managed via the backend API.
They are linked to the GitHub account of the user. 
At the time of implementation, setting up a GitHub app was the easiest way to authenticate users.

