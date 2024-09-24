import { defineConfig } from 'auth-astro';
import { getGitHubClientId, getGitHubClientSecret } from './config';
import GitHub from '@auth/core/providers/github';

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
            clientId: getGitHubClientId(),
            clientSecret: getGitHubClientSecret(),
        }),
    ],
    secret: crypto.randomUUID(),
});
