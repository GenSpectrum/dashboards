# Dashboards

### Getting started

Set up a `.env` file, e.g. by

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Start app in development mode:

```bash
npm run dev
```

### Setting up a GitHub App for Authentication

1. Create a new GitHub App: https://github.com/settings/apps/new
    1. Add a homepage URL to a page which describes the login/app. For testing this can be `http://localhost:4321`.
    2. Add the callback URL `http://localhost:4321`, because the website runs on this port in development mode.
    3. Add account permission: read-only access to the user's email address.
    - (Optionally) disable webhooks
    - The name of the GitHub app will be shown to the user when they log in.
      If you intend to use it in production, you should choose a descriptive name.

2. Generate a client secret
3. Add the client id and secret to your `.env` file.

### Configuration

The website needs the following environment variables:

- `CONFIG_DIR`: The directory where the configuration yaml files are stored.
  Note that this is already **set at build-time in the Docker images**.
  Actually there should only be two reasonable values:
    - `../backend/src/main/resources/` for local development (reusing the backend configuration)
    - `/config` in the Docker container (which contains copies of the backend configuration files)
- `DASHBOARDS_ENVIRONMENT`: Toggle between different configurations.
  This will read the corresponding configuration yaml files from the directory specified in the `CONFIG_DIR` environment
  variable.
- `BACKEND_URL`: The URL of the backend server (typically the corresponding Docker compose service).
  This value is not set in config files, as it usually depends on the service name of the backend.
- `GITHUB_CLIENT_SECRET`: The client secret of the GitHub app.
  This value is supposed to be kept secret and should not be stored in the configuration files.

The GitHub app client id can be overwritten via the `GITHUB_CLIENT_ID` environment variable for easier local testing.
This should not be necessary in real deployments, as the configuration yaml files should contain the correct values.

### Using icons

We are using the Tailwind integration of [Iconify](https://iconify.design/docs/usage/css/tailwind/).

We have the following icon sets available:

- https://icon-sets.iconify.design/mdi-light/
- https://icon-sets.iconify.design/mdi/

If you need to add additional icon sets,
you need to install the corresponding npm package
and add the icon selector to the `tailwind.config.mjs` file.

You can use the icons in the code via

```html
<span class="iconify mdi--account text-4xl"></span>
```

### Using Your Local Components Copy

For development, it might be useful to use your local version of the
[dashboard-components](https://github.com/GenSpectrum/dashboard-components):

0. Stop the current `npm run dev` process.
1. Build the components locally by running `npm run build` in the components directory (if that runs out of memory, you may have to `export NODE_OPTIONS=--max_old_space_size=4096`)
2. Install the local components
   (assuming that you have cloned the dashboards and the dashboard-components into the same directory):

```bash
npm i ../../dashboard-components/components
```

3. Run `npm run dev`.
4. Make your changes in the dashboard-components.
5. Build the components.

> Note: You need to rebuild the components every time you make changes to them.
> Otherwise the changes will not be visible in the dashboards.
> `npm i ../../dashboard-components/components` only has to be executed once, though.

This makes use of https://docs.npmjs.com/cli/v9/configuring-npm/package-json#local-paths.

### Deployments

[Genspectrum staging](https://staging.genspectrum.org/) reflects the state of the `main` branch.
Merging changes into the `prod` branch will update [Genspectrum](https://genspectrum.org/).
A [dependabot workflow](https://github.com/GenSpectrum/dashboards/blob/main/.github/workflows/rebaseProd.yml) will produce a PR to update the prod branch. Please be sure to merge the PR, do not squash-merge, or rebase and merge.
