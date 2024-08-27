import { getSession } from 'auth-astro/server';
import { getDashboardsConfig } from '../../../config.ts';

const API_PATHNAME_LENGTH = '/api'.length;

export async function ALL({ request }: { request: Request }) {
    const session = await getSession(request);

    if (!session || !session.user?.id) {
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
        console.error(error);
        return getInternalErrorResponse(request.url);
    }
}

function getBackendUrl(request: Request, userId: string) {
    const backendEndpoint = new URL(request.url).pathname.slice(API_PATHNAME_LENGTH);
    const backendUrl = new URL(backendEndpoint, getDashboardsConfig().backend.url);

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
            'Content-Type': 'application/json',
        },
    });
};