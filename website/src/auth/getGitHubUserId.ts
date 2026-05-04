import { auth } from '../auth';

/**
 * Returns the GitHub numeric user ID for the currently authenticated user, or undefined if the
 * user is not logged in.
 *
 * better-auth stores an internal randomly generated ID on `session.user.id`, which is not the
 * GitHub user ID. The real GitHub ID is stored as `accountId` on the linked account record.
 * This function retrieves it via `listUserAccounts` and finds the account with providerId 'github'.
 *
 * This ID is used as the `userId` query parameter in backend API calls, where it is used for
 * ownership checks (e.g. whether a user can edit or delete a collection).
 */
export async function getGitHubUserId(headers: Headers): Promise<string | undefined> {
    const session = await auth.api.getSession({ headers });
    if (!session) return undefined;

    const accounts = await auth.api.listUserAccounts({ headers });
    return accounts.find((a) => a.providerId === 'github')?.accountId;
}
