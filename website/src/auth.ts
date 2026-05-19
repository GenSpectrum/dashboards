import { betterAuth } from 'better-auth';

import { getBackendHost, getTrustedOrigins, getGitHubClientId, getGitHubClientSecret } from './config';
import { getInstanceLogger } from './logger';

const logger = getInstanceLogger('Auth');

export const auth = betterAuth({
    logger: {
        level: 'debug',
        log: (level, message) => {
            switch (level) {
                case 'warn':
                    logger.warn(message);
                    break;
                case 'error':
                    logger.error(message);
                    break;
                case 'debug':
                    logger.debug(message);
                    break;
                default:
                    logger.info(message);
            }
        },
    },
    trustedOrigins: getTrustedOrigins(),
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        // The cookie cache in combination with refreshCache: true, means that all the session
        // information is in a session cookie; the server is completly stateless.
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60,
            strategy: 'jwe',
            refreshCache: true,
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
                            name: profile.name ?? profile.login ?? '',
                            email: profile.email ?? null,
                        }),
                    });

                    if (response.ok) {
                        const user = (await response.json()) as { id: number };
                        return { gsUserId: user.id };
                    }

                    throw new Error(`Failed to sync user with backend: HTTP ${response.status}`);
                } catch (error) {
                    logger.error(`Failed to sync user with backend: ${error}`);
                    throw error;
                }
            },
        },
    },
    // enable account cookie (we're running stateless, no DB for account info)
    account: {
        storeAccountCookie: true,
    },
    advanced: {
        trustedProxyHeaders: true,
        cookiePrefix: 'genspectrum',
    },
});
