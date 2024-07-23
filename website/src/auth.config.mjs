import { defineConfig } from 'auth-astro';
import Keycloak from '@auth/core/providers/keycloak';
import { getDashboardsConfig } from './config';

const authConfig = getDashboardsConfig().auth;

export default defineConfig({
    providers: [
        Keycloak({
            clientId: authConfig.clientId,
            issuer: authConfig.issuer,
            clientSecret: authConfig.clientSecret,
        }),
    ],
    secret: crypto.randomUUID(),
});
