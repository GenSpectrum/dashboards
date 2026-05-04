import { getBackendHost } from '../config.ts';
import { getGitHubUserId } from '../auth/getGitHubUserId.ts';
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
export async function proxyToBackend({ request }: { request: Request }): Promise<Response> {
    const userId = await getGitHubUserId(request.headers);

    if (userId === undefined) {
        return getUnauthorizedResponse(request.url);
    }

    return proxyRequest(request, userId);
}

/**
 * Proxies the request to the backend without any user ID, regardless of login state.
 */
export async function proxyToBackendNoAuth({ request }: { request: Request }): Promise<Response> {
    return proxyRequest(request, undefined);
}

async function proxyRequest(request: Request, userId: string | undefined): Promise<Response> {
    const backendUrl = getBackendUrl(request, userId);

    try {
        const response = await fetch(backendUrl, request);

        return new Response(response.body, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        logger.error(getErrorLogMessage(error));
        return getInternalErrorResponse(request.url);
    }
}

function getBackendUrl(request: Request, userId: string | undefined) {
    const backendEndpoint = new URL(request.url).pathname.slice(API_PATHNAME_LENGTH);
    const backendUrl = new URL(backendEndpoint, getBackendHost());

    new URL(request.url).searchParams.forEach((value, key) => {
        backendUrl.searchParams.set(key, value);
    });

    if (userId !== undefined) {
        backendUrl.searchParams.set('userId', userId);
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
