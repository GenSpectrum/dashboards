/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
// declare module 'set-cookie-parser' is added, because tsc checks our dependency auth-astro/server,
// which uses set-cookie-parser, and it doesn't have types.
declare module 'set-cookie-parser';

interface ImportMetaEnv {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly DASHBOARDS_ENVIRONMENT: 'dashboards-staging' | 'dashboards-prod';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
