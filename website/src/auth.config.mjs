import { defineConfig } from 'auth-astro';
import { getDashboardsConfig } from './config';

const authConfig = getDashboardsConfig().auth;

export default defineConfig({
    providers: [
    ],
    secret: crypto.randomUUID(),
});
