import { defineMiddleware } from 'astro/middleware';

import { auth } from '../auth';

// Auth middleware that extracts session and user info from the session cookie
// and stores the info in the Astro locals context.
export const authMiddleware = defineMiddleware(async (context, next) => {
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
