import { defineMiddleware } from 'astro/middleware';

import { auth } from '../auth';
import { getBackendHost } from '../config.ts';
import { getInstanceLogger } from '../logger.ts';
import { getErrorLogMessage } from '../util/getErrorLogMessage.ts';

const logger = getInstanceLogger('AuthMiddleware');

// Auth middleware that extracts session and user info from the session cookie
// and stores the info in the Astro locals context.
export const authMiddleware = defineMiddleware(async (context, next) => {
    const authHeader = context.request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const apiKey = authHeader.slice('Bearer '.length);
        const userId = await validateApiKey(apiKey);
        if (userId !== undefined) {
            context.locals.user = undefined;
            context.locals.session = undefined;
            context.locals.gsUserId = userId;
            return next();
        }
    }

    const session = await auth.api.getSession({ headers: context.request.headers });

    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- better-auth serialises all session fields as strings in the JWE cookie regardless of the declared field type
        context.locals.gsUserId = Number(session.user.gsUserId);
    } else {
        context.locals.user = undefined;
        context.locals.session = undefined;
        context.locals.gsUserId = undefined;
    }

    return next();
});

async function validateApiKey(key: string): Promise<number | undefined> {
    try {
        const response = await fetch(`${getBackendHost()}/internal/api-keys/validate`, {
            method: 'POST',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key }),
        });
        if (response.ok) {
            const data = (await response.json()) as { userId: number };
            return data.userId;
        }
        if (response.status !== 404) {
            logger.error(`Unexpected response from API key validation: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        logger.error(`Failed to reach backend for API key validation: ${getErrorLogMessage(error)}`);
    }
    return undefined;
}
