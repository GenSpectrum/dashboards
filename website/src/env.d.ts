/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
    // Note: 'import {} from ""' syntax does not work in .d.ts files.
    // We derive the User type from the auth config so that additionalFields (e.g. gsUserId) are included.
    type AuthUser = NonNullable<Awaited<ReturnType<(typeof import('./auth').auth)['api']['getSession']>>>['user'];

    interface Locals {
        user: AuthUser | undefined;
        session: import('better-auth').Session | undefined;
        gsUserId: number | undefined;
    }
}

interface ImportMetaEnv {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly DASHBOARDS_ENVIRONMENT: 'dashboards-staging' | 'dashboards-prod';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
