/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly DASHBOARDS_ENVIRONMENT: 'dashboards-staging' | 'dashboards-prod';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
