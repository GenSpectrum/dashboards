/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
    // In auth.ts we define 'additionalFields' for the user type, so we need to define our own AuthUser type
    // here, based on that (we can't use the plain 'User' from better-auth).  This properly defines the
    // additional fields.
    type AuthUser = NonNullable<Awaited<ReturnType<(typeof import('./auth').auth)['api']['getSession']>>>['user'];

    interface Locals {
        user: AuthUser | null; // we use our own user type, see not above
        session: import('better-auth').Session | null;
    }
}

interface ImportMetaEnv {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly DASHBOARDS_ENVIRONMENT: 'dashboards-staging' | 'dashboards-prod';
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
