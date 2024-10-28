import { getSession } from 'auth-astro/server';

import { getBackendHost } from '../../../config.ts';
import { getInstanceLogger } from '../../../logger.ts';
import { getErrorLogMessage } from '../../../util/getErrorLogMessage.ts';

const API_PATHNAME_LENGTH = '/api'.length;

const logger = getInstanceLogger('SubscriptionsProxy');

export async function ALL({ request }: { request: Request }) {
    const session = await getSession(request);

    if (!session || session.user?.id === undefined) {
        return getUnauthorizedResponse(request.url);
    }

    const backendUrl = getBackendUrl(request, session.user.id);

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

function getBackendUrl(request: Request, userId: string) {
    const backendEndpoint = new URL(request.url).pathname.slice(API_PATHNAME_LENGTH);
    const backendUrl = new URL(backendEndpoint, getBackendHost());

    new URL(request.url).searchParams.forEach((value, key) => {
        backendUrl.searchParams.set(key, value);
    });

    backendUrl.searchParams.set('userId', userId);

    return backendUrl;
}

type BackendError = {
    title: string;
    detail: string;
    status: number;
    instance: string;
};

const getUnauthorizedResponse = (requestUrl: string) => {
    const response: BackendError = {
        title: 'Unauthorized',
        detail: "You're not authorized to access this resource",
        status: 401,
        instance: requestUrl,
    };

    return new Response(JSON.stringify({ response }), {
        status: 401,
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
        },
    });
};

const getInternalErrorResponse = (requestUrl: string) => {
    const response: BackendError = {
        title: 'Internal Server Error',
        detail: "Couldn't fetch data from the backend",
        status: 500,
        instance: requestUrl,
    };

    return new Response(JSON.stringify({ response }), {
        status: 500,
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
        },
    });
};
