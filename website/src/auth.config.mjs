import { defineConfig } from 'auth-astro';
import { getGitHubClientId, getGitHubClientSecret } from './config';
import GitHub from '@auth/core/providers/github';

export default defineConfig({
    callbacks: {
        session: async ({ session, token }) => {
            if (session?.user) {
                session.user.id = token.userIdFromProvider;
            }

            return session;
        },
        jwt: ({ profile, token }) => {
            if (!profile) {
                return token;
            }

            // This step in necessary, since @auth/core overwrites the id from the provider with a random UUID
            // The id is then extracted in the session callback and assigned to the user object
            return {
                ...token,
                userIdFromProvider: profile.id,
            };
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
