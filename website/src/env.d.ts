/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
// declare module 'set-cookie-parser' is added, because tsc checks our dependency auth-astro/server,
// which uses set-cookie-parser, and it doesn't have types.
declare module 'set-cookie-parser';
