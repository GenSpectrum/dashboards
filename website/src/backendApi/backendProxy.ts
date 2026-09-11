import type { APIContext } from 'astro';

import { getBackendHost } from '../config.ts';
import { getInstanceLogger } from '../logger.ts';
import type { ProblemDetail } from '../types/ProblemDetail.ts';
import { getErrorLogMessage } from '../util/getErrorLogMessage.ts';

const logger = getInstanceLogger('BackendProxy');

const API_PATHNAME_LENGTH = '/api'.length;

/**
 * Calls the backend. If the user is logged in, the user ID is added from the session.
 * This proxying through the frontend server is used, so we do the user login handling
 * in here, instead of in the backend.
 */
export async function proxyToBackend(context: APIContext): Promise<Response> {
    const userId = context.locals.gsUserId;

    if (userId === undefined) {
        return getUnauthorizedResponse(context.request.url);
    }

    return proxyRequest(context.request, userId);
}

/**
 * Proxies the request to the backend without any user ID, regardless of login state.
 * This is used for public, read-only data, so the response is also made available
 * cross-origin to any website (no credentials are involved on these routes).
 */
export async function proxyToBackendNoAuth(context: APIContext): Promise<Response> {
    return proxyRequest(context.request, undefined, { cors: true });
}

/**
 * Headers a client may need to send on these public, no-auth GET routes.
 * None of the underlying endpoints read any request headers (they only take
 * path/query params), so `content-type` is the only one worth allowing: some
 * HTTP clients set it by default even on a bodyless GET, which would otherwise
 * turn a same-origin-safe simple request into a failing preflighted one.
 */
const ALLOWED_REQUEST_HEADERS = 'content-type';

/**
 * Answers a CORS preflight request for a public, no-auth GET route.
 */
export function corsPreflightResponse(): Response {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', ALLOWED_REQUEST_HEADERS);

    return new Response(null, { status: 204, headers });
}

async function proxyRequest(
    request: Request,
    userId: number | undefined,
    options: { cors?: boolean } = {},
): Promise<Response> {
    const backendUrl = getBackendUrl(request, userId);

    try {
        const response = await fetch(backendUrl, request);

        const headers = new Headers(response.headers);
        if (options.cors === true) {
            headers.set('Access-Control-Allow-Origin', '*');
        }

        return new Response(response.body, {
            status: response.status,
            headers,
        });
    } catch (error) {
        logger.error(getErrorLogMessage(error));
        const errorResponse = getInternalErrorResponse(request.url);
        if (options.cors === true) {
            errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        }
        return errorResponse;
    }
}

function getBackendUrl(request: Request, userId: number | undefined) {
    const backendEndpoint = new URL(request.url).pathname.slice(API_PATHNAME_LENGTH);
    const backendUrl = new URL(backendEndpoint, getBackendHost());

    new URL(request.url).searchParams.forEach((value, key) => {
        backendUrl.searchParams.set(key, value);
    });

    if (userId !== undefined) {
        backendUrl.searchParams.set('userId', String(userId));
    }

    return backendUrl;
}

const getUnauthorizedResponse = (requestUrl: string) => {
    const response: ProblemDetail = {
        title: 'Unauthorized',
        detail: "You're not authorized to access this resource",
        status: 401,
        instance: requestUrl,
    };

    return Response.json(response, {
        status: 401,
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
        },
    });
};

const getInternalErrorResponse = (requestUrl: string) => {
    const response: ProblemDetail = {
        title: 'Internal Server Error',
        detail: 'Failed to connect the backend service',
        status: 500,
        instance: requestUrl,
    };

    return Response.json(response, {
        status: 500,
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
        },
    });
};
