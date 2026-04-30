import { betterAuth } from 'better-auth';

import { getGitHubClientId, getGitHubClientSecret } from './config';

export const auth = betterAuth({
    // TODO - maybe we can check again if this is read automatically? Should be, according to the docs.
    secret: process.env.AUTH_SECRET,
    socialProviders: {
        github: {
            clientId: getGitHubClientId(),
            clientSecret: getGitHubClientSecret(),
            // TODO: Verify that session.user.id contains the GitHub numeric user ID, not a generated UUID.
            //
            // BACKGROUND:
            // The old auth-astro setup used two callbacks to work around @auth/core overwriting the
            // GitHub user ID with a random UUID:
            //   - jwt callback: stashed profile.id (the real GitHub numeric ID) as token.userIdFromProvider
            //   - session callback: copied token.userIdFromProvider onto session.user.id
            // This ensured session.user.id === "<github_numeric_id>" (e.g. "12345678").
            //
            // RISK:
            // In better-auth's stateless mode (no database), session.user.id may be a generated ID
            // rather than the GitHub numeric ID. This would break backend API calls, because
            // backendProxy.ts passes session.user.id as the `userId` query parameter, and the backend
            // uses that ID for ownership checks (e.g. who owns a collection). If the ID is wrong,
            // users will be unable to edit or delete their own resources.
            //
            // HOW TO VERIFY:
            // Sign in with GitHub, then log session.user.id in backendProxy.ts and check whether it
            // matches your GitHub numeric account ID (visible at https://api.github.com/users/<your-username>).
            //
            // WORKAROUND (if session.user.id is not the GitHub ID):
            // Add a mapProfileToUser function here to explicitly set the user ID from the provider profile:
            //
            //   mapProfileToUser: (profile) => ({
            //       id: String(profile.id),
            //       name: profile.name,
            //       email: profile.email,
            //       image: profile.avatar_url,
            //   }),
            //
            // First verify that `mapProfileToUser` is the correct option name by checking the type
            // definitions in node_modules/better-auth/dist/types.d.ts, as the API may differ from
            // what is described in community examples.
        },
    },
    advanced: {
        trustedProxyHeaders: true,
    },
});
