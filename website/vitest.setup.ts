import { type AssertionError } from 'node:assert';

import { type DefaultBodyType, http, type StrictRequest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';

import type { ProblemDetail } from './src/types/ProblemDetail.ts';
import type {
    SubscriptionPutRequest,
    SubscriptionRequest,
    SubscriptionResponse,
    TriggerEvaluationResponse,
} from './src/types/Subscription.ts';

export const DUMMY_BACKEND_URL = 'http://backend.dummy';

export const testServer = setupServer();

function getError(assertionError: AssertionError) {
    return `${assertionError.message} - expected: ${JSON.stringify(assertionError.expected)} - actual ${JSON.stringify(assertionError.actual)}`;
}

export const backendRequestMocks = {
    getSubscriptions: (
        requestParam: { userId: string },
        response: SubscriptionResponse[],
        statusCode: number = 200,
    ) => {
        testServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, resolver({ statusCode, response, requestParam })),
        );
    },
    getEvaluateTrigger: (
        requestParam: { userId: string; id: string },
        response: TriggerEvaluationResponse,
        statusCode: number = 200,
    ) => {
        testServer.use(
            http.get(
                `${DUMMY_BACKEND_URL}/subscriptions/evaluateTrigger`,
                resolver({ statusCode, response, requestParam }),
            ),
        );
    },
    postSubscription: (
        body: SubscriptionRequest,
        requestParam: { userId: string },
        response: SubscriptionResponse,
        statusCode: number = 200,
    ) => {
        testServer.use(
            http.post(`${DUMMY_BACKEND_URL}/subscriptions`, resolver({ statusCode, body, response, requestParam })),
        );
    },
    putSubscription: (
        body: SubscriptionPutRequest,
        requestParam: { userId: string },
        pathVariables: { subscriptionId: string },
        response: SubscriptionResponse,
        statusCode: number = 200,
    ) => {
        testServer.use(
            http.put(
                `${DUMMY_BACKEND_URL}/subscriptions/${pathVariables.subscriptionId}`,
                resolver({ statusCode, body, response, requestParam }),
            ),
        );
    },
    deleteSubscription: (
        requestParam: { userId: string },
        pathVariables: { subscriptionId: string },
        statusCode: number = 204,
    ) => {
        testServer.use(
            http.delete(
                `${DUMMY_BACKEND_URL}/subscriptions/${pathVariables.subscriptionId}`,
                resolver({ statusCode, requestParam }),
            ),
        );
    },
    getSubscriptionsBackendError: (
        response: ProblemDetail | { notProblemDetail: string },
        statusCode: number = 400,
    ) => {
        testServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, async () => {
                return new Response(JSON.stringify(response), {
                    status: statusCode,
                });
            }),
        );
    },
};

function resolver<Request, Response>({
    statusCode,
    body,
    response,
    requestParam,
}: {
    statusCode: number;
    body?: Request;
    response?: Response;
    requestParam?: Record<string, string>;
}) {
    return async ({ request }: { request: StrictRequest<DefaultBodyType> }) => {
        try {
            if (requestParam !== undefined) {
                const actualRequestParam = new URL(request.url).searchParams;
                for (const [key, value] of Object.entries(requestParam)) {
                    expect(actualRequestParam.get(key), `Request param ${key} did not match`).to.equal(value);
                }
                for (const [key, value] of actualRequestParam) {
                    expect(requestParam[key], `Request param ${key} was not expected`).to.equal(value);
                }
            }
            if (body !== undefined) {
                const actualBody = await request.json();
                expect(actualBody, 'Request body did not match').to.deep.equal(body);
            }
        } catch (error) {
            return new Response(
                JSON.stringify({
                    error: getError(error as AssertionError),
                }),
                {
                    status: 400,
                },
            );
        }
        return new Response(JSON.stringify(response), {
            status: statusCode,
        });
    };
}

beforeAll(() => testServer.listen({ onUnhandledRequest: 'warn' }));

afterAll(() => testServer.close());

afterEach(() => testServer.resetHandlers());