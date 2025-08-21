# How does configuration work?

## Configuration files

Some configuration files are shared between backend and website:

- [application-dashboards-prod.yaml](../backend/src/main/resources/application-dashboards-prod.yaml),
- [application-dashboards-staging.yaml](../backend/src/main/resources/application-dashboards-staging.yaml)

It was decided to put them in `backend/`, and are still there even though
the backend is currently unused.

The configuration is read in [website/src/config.ts](../website/src/config.ts), which also defines a [zod](https://zod.dev/) schema for the validity of the website config files.

XX Wie gelangt config ins frontend? bundled?

    function getConfigDir(): string {
        return processEnvOrMetaEnv('CONFIG_DIR', z.string().min(1));
    }


## Wastewater: hard coded

There's also
[wastewaterConfig.ts](../website/src/types/wastewaterConfig.ts), which
is hard-coding values since they are falling a bit outside the rest
(?) and it was felt they were not worth the effort creating a config
file for. It also only defines some URLs and colors (and the pages).

<!-- V: 440.1 -->

The wastewater pages behave like they were about organisms. (XX?)



XX matrix

