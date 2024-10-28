import { defineMiddleware } from 'astro/middleware';

import { getInstanceLogger } from '../logger.ts';

const logger = getInstanceLogger('RequestLoggingMiddleware');

export const loggingMiddleware = defineMiddleware(async (context, next) => {
    const response = await next();
    logger.info(
        `Request: ${context.request.method} ${context.url.pathname} - Responding with status ${response.status}`,
    );
    return response;
});
