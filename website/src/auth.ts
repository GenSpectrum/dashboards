import { betterAuth } from 'better-auth';

import { getGitHubClientId, getGitHubClientSecret } from './config';

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
            mapProfileToUser: (profile) => ({ githubId: profile.id }),
        },
    },
    advanced: {
        trustedProxyHeaders: true,
        cookiePrefix: 'gen-spectrum',
    },
});
