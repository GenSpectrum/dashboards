import { betterAuth } from 'better-auth';

import { getBackendHost, getGitHubClientId, getGitHubClientSecret } from './config';
import { getInstanceLogger } from './logger';

const logger = getInstanceLogger('Auth');

export const auth = betterAuth({
    // TODO - maybe we can check again if this is read automatically? Should be, according to the docs.
    secret: process.env.AUTH_SECRET,
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60,
            strategy: 'jwe',
        },
    },
    user: {
        additionalFields: {
            gsUserId: {
                type: 'number',
                required: true,
                input: false,
            },
        },
    },
    socialProviders: {
        github: {
            clientId: getGitHubClientId(),
            clientSecret: getGitHubClientSecret(),
            mapProfileToUser: async (profile) => {
                try {
                    const response = await fetch(`${getBackendHost()}/users/sync`, {
                        method: 'POST',
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- profile.id is typed as string but GitHub returns a number at runtime
                            githubId: String(profile.id),
                            name: profile.name || profile.login || '',
                            email: profile.email ?? null,
                        }),
                    });

                    if (response.ok) {
                        const user = (await response.json()) as { id: number };
                        return { gsUserId: String(user.id) };
                    }

                    throw new Error(`Failed to sync user with backend: HTTP ${response.status}`);
                } catch (error) {
                    logger.error(`Failed to sync user with backend: ${error}`);
                    throw error;
                }
            },
        },
    },
    advanced: {
        trustedProxyHeaders: true,
        cookiePrefix: 'gen-spectrum',
    },
});
