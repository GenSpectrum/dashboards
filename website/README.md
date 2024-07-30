# Dashboards

### Getting started

Set up a `.env` file, e.g. by

```bash
cp .env.example .env
```

Set up your local config in `tests/config`, e.g. by

```bash
cp tests/config/dashboards_config.example.json tests/config/dashboards_config.json
cp tests/config/secrets.example.json tests/config/secrets.json
```

and edit the values accordingly.

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
3. Add the client id to the dashboards config file `tests/config/dashboards_config.json` at `auth.github.clientId`.
4. Add the client secret to the secrets config file `tests/config/secrets.json` at `github.clientSecret`.

### Using icons

We are using the Tailwind ingegration of [Iconify](https://iconify.design/docs/usage/css/tailwind/).

We have the following icon sets available:

-   https://icon-sets.iconify.design/mdi-light/
-   https://icon-sets.iconify.design/mdi/

If you need to add additional icon sets,
you need to install the corresponding npm package
and add the icon selector to the `tailwind.config.mjs` file.

You can use the icons in the code via

```html
<span class="iconify text-4xl mdi--account"></span>
```
