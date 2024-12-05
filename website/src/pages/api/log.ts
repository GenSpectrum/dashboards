import type { APIRoute } from 'astro';

import { getInstanceLogger } from '../../logger.ts';
import { type InstanceLogger, logMessageSchema } from '../../types/logMessage.ts';

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();
    const maybeLogMessage = logMessageSchema.safeParse(body);

    if (maybeLogMessage.success) {
        const { instance, level, message, errorId } = maybeLogMessage.data;
        getLogger(instance)[level](message, { errorId });
        return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify(maybeLogMessage.error.issues), { status: 400 });
};

const loggers = new Map<string, InstanceLogger>();

function getLogger(instance: string) {
    let logger = loggers.get(instance);
    if (!logger) {
        logger = getInstanceLogger(instance);
        loggers.set(instance, logger);
    }
    return logger;
}
