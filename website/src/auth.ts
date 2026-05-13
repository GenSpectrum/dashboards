import { betterAuth } from 'better-auth';

import { getGitHubClientId, getGitHubClientSecret } from './config';

export const auth = betterAuth({
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
            githubId: {
                type: 'string',
                input: false,
            },
        },
    },
    socialProviders: {
        github: {
            clientId: getGitHubClientId(),
            clientSecret: getGitHubClientSecret(),
            // store the GitHub user ID (i.e. 45882389) in the 'user' object,
            // which is easy to access from context later on.
            // the 'id' property cannot be overwritten.
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- profile.id is typed as string but GitHub returns a number at runtime; String() ensures it's always stored as a string for consistent ownership checks
            mapProfileToUser: (profile) => ({ githubId: String(profile.id) }),
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
