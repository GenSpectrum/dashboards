import { defineMiddleware } from 'astro/middleware';

import { auth } from '../auth';

// Auth middleware that extracts session and user info from the session cookie
// and stores the info in the Astro locals context.
export const authMiddleware = defineMiddleware(async (context, next) => {
    const session = await auth.api.getSession({ headers: context.request.headers });

    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
    } else {
        context.locals.user = null;
        context.locals.session = null;
    }

    return next();
});
