import { type AssertionError } from 'node:assert';

import type { LapisFilter } from '@genspectrum/dashboard-components/util';
import { type DefaultBodyType, http, type StrictRequest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

import type { OrganismsConfig } from './src/config.ts';
import type { LapisInfo } from './src/lapis/getLastUpdatedDate.ts';
import type { ProblemDetail } from './src/types/ProblemDetail.ts';
import type {
    SubscriptionPutRequest,
    SubscriptionRequest,
    SubscriptionResponse,
    TriggerEvaluationResponse,
} from './src/types/Subscription.ts';
import setupDayjs from './src/util/setupDayjs.ts';

setupDayjs();

export const ASTRO_SERVER_URL = '/api';
export const DUMMY_BACKEND_URL = 'http://backend.dummy';
export const DUMMY_LAPIS_URL = 'http://lapis.dummy';

export const testServer = setupServer();

function getError(assertionError: AssertionError) {
    return `${assertionError.message} - expected: ${JSON.stringify(assertionError.expected)} - actual ${JSON.stringify(assertionError.actual)}`;
}

type ReferenceSequence = { name: string; sequence: string };
type ReferenceGenome = { nucleotideSequences: ReferenceSequence[]; genes: ReferenceSequence[] };

export const astroApiMocks = {
    log: () => {
        testServer.use(http.post(`${ASTRO_SERVER_URL}/log`, () => Response.json({})));
    },
};

export const lapisRequestMocks = {
    info: (response: LapisInfo, statusCode = 200) => {
        testServer.use(http.get(`${DUMMY_LAPIS_URL}/sample/info`, resolver({ statusCode, response })));
    },
    postAggregated: (
        body: LapisFilter,
        response: { data: Record<string, string | boolean | number>[] },
        statusCode = 200,
    ) => {
        testServer.use(http.post(`${DUMMY_LAPIS_URL}/sample/aggregated`, resolver({ statusCode, body, response })));
    },
    referenceGenome: (response: ReferenceGenome, statusCode = 200) => {
        testServer.use(http.get(`${DUMMY_LAPIS_URL}/sample/referenceGenome`, resolver({ statusCode, response })));
    },
};

export const backendRequestMocks = {
    getSubscriptions: (requestParam: { userId: string }, response: SubscriptionResponse[], statusCode = 200) => {
        testServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, resolver({ statusCode, response, requestParam })),
        );
    },
    getEvaluateTrigger: (
        requestParam: { userId: string; id: string },
        response: TriggerEvaluationResponse,
        statusCode = 200,
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
        statusCode = 200,
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
        statusCode = 200,
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
        statusCode = 204,
    ) => {
        testServer.use(
            http.delete(
                `${DUMMY_BACKEND_URL}/subscriptions/${pathVariables.subscriptionId}`,
                resolver({ statusCode, requestParam }),
            ),
        );
    },
    getSubscriptionsBackendError: (response: ProblemDetail | { notProblemDetail: string }, statusCode = 400) => {
        testServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, () => {
                return new Response(JSON.stringify(response), {
                    status: statusCode,
                });
            }),
        );
    },
};

function resolver({
    statusCode,
    body,
    response,
    requestParam,
}: {
    statusCode: number;
    body?: unknown;
    response?: unknown;
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

export const testOrganismsConfig = {
    covid: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'date',
        },
    },
    influenzaA: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    h3n2: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    h1n1pdm: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    h5n1: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    influenzaB: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    victoria: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    westNile: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDateRangeLower',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    rsvA: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    rsvB: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    mpox: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDateRangeLower',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    ebolaSudan: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDateRangeLower',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    ebolaZaire: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDateRangeLower',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    cchf: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDateRangeLower',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    denv1: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    denv2: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    denv3: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
    denv4: {
        lapis: {
            url: DUMMY_LAPIS_URL,
            mainDateField: 'sampleCollectionDate',
            additionalFilters: {
                versionStatus: 'LATEST_VERSION',
                isRevocation: 'false',
            },
        },
    },
} satisfies OrganismsConfig;
