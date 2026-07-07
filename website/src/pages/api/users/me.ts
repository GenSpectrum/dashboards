import type { APIContext } from 'astro';

import { getBackendHost } from '../../../config.ts';
import { getInstanceLogger } from '../../../logger.ts';
import type { ProblemDetail } from '../../../types/ProblemDetail.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

const logger = getInstanceLogger('UsersMe');

export async function GET(context: APIContext): Promise<Response> {
    const userId = context.locals.gsUserId;

    if (userId === undefined) {
        const body: ProblemDetail = {
            title: 'Unauthorized',
            detail: "You're not authorized to access this resource",
            status: 401,
            instance: context.request.url,
        };
        return Response.json(body, { status: 401 });
    }

    try {
        const response = await fetch(new URL(`/users/${userId}`, getBackendHost()));
        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        logger.error(getErrorLogMessage(error));
        const body: ProblemDetail = {
            title: 'Internal Server Error',
            detail: 'Failed to connect the backend service',
            status: 500,
            instance: context.request.url,
        };
        return Response.json(body, { status: 500 });
    }
}
