# Dashboards

### Getting started

Set up a `.env` file, e.g. by

```bash
cp .env.example .env
```

Set up your local config in `tests/config`, e.g. by

```bash
cp tests/config/dashboards_config.example.json tests/config/dashboards_config.json
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
