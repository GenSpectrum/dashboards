import { defineConfig } from 'auth-astro';
import { getDashboardsConfig, getSecretsConfig } from './config';
import GitHub from '@auth/core/providers/github';

const authConfig = getDashboardsConfig().auth;
const secretsConfig = getSecretsConfig();

export default defineConfig({
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user) {
                session.user.id = token.sub;
            }

            return session;
        },
    },
    providers: [
        GitHub({
            clientId: authConfig.github.clientId,
            clientSecret: secretsConfig.github.clientSecret,
        }),
    ],
    secret: crypto.randomUUID(),
});
