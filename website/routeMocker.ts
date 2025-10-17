import { http } from 'msw';
import type { DefaultBodyType, StrictRequest } from 'msw';
import type { SetupWorker } from 'msw/browser';
import type { SetupServer } from 'msw/node';
import { expect } from 'vitest';

import { type OrganismsConfig } from './src/config';
import type { LapisInfo } from './src/lapis/getLastUpdatedDate.ts';
import type { ProblemDetail } from './src/types/ProblemDetail.ts';
import type {
    SubscriptionPutRequest,
    SubscriptionRequest,
    SubscriptionResponse,
    TriggerEvaluationResponse,
} from './src/types/Subscription.ts';

export const ASTRO_SERVER_URL = '/api';
export const DUMMY_BACKEND_URL = 'http://backend.dummy';
export const DUMMY_LAPIS_URL = 'http://lapis.dummy';

type MSWWorkerOrServer = SetupWorker | SetupServer;

export class AstroApiRouteMocker {
    constructor(private workerOrServer: MSWWorkerOrServer) {}

    mockLog() {
        this.workerOrServer.use(http.post(`${ASTRO_SERVER_URL}/log`, () => Response.json({})));
    }
}

type ReferenceSequence = { name: string; sequence: string };
type ReferenceGenome = { nucleotideSequences: ReferenceSequence[]; genes: ReferenceSequence[] };
type LineageDefinition = Record<
    string,
    {
        parents?: string[];
        aliases: string[];
    }
>;

type MockCase = {
    statusCode?: number;
    body?: unknown;
    response?: unknown;
    requestParam?: Record<string, string>;
};

/**
 * Allows you to mock LAPIS API routes.
 * By default, the host is DUMMY_LAPIS_URL, so it's best if you use that as the lapisUrl in your tests.
 * Some mock functions exist with the *WithUrl suffix, where you can override the lapisUrl as well.
 */
export class LapisRouteMocker {
    constructor(private workerOrServer: MSWWorkerOrServer) {}

    mockInfo(response: LapisInfo, statusCode = 200) {
        this.workerOrServer.use(http.get(`${DUMMY_LAPIS_URL}/sample/info`, resolver([{ statusCode, response }])));
    }

    mockPostAggregated(
        body: Record<string, unknown>,
        response: { data: Record<string, string | boolean | number | null>[] },
        statusCode = 200,
    ) {
        this.mockPostAggregatedWithUrl(DUMMY_LAPIS_URL, body, response, statusCode);
    }

    mockPostAggregatedWithUrl(
        lapisUrl: string,
        body: Record<string, unknown>,
        response: { data: Record<string, string | boolean | number | null>[] },
        statusCode = 200,
    ) {
        this.workerOrServer.use(http.post(`${lapisUrl}/sample/aggregated`, resolver([{ statusCode, body, response }])));
    }

    mockPostAggregatedMulti(cases: MockCase[]) {
        this.workerOrServer.use(http.post(`${DUMMY_LAPIS_URL}/sample/aggregated`, resolver(cases)));
    }

    mockReferenceGenome(response: ReferenceGenome, statusCode = 200) {
        this.mockReferenceGenomeWithUrl(DUMMY_LAPIS_URL, response, statusCode);
    }

    mockReferenceGenomeWithUrl(lapisUrl: string, response: ReferenceGenome, statusCode = 200) {
        this.workerOrServer.use(http.get(`${lapisUrl}/sample/referenceGenome`, resolver([{ statusCode, response }])));
    }

    mockLineageDefinition(fieldName: string, response: LineageDefinition, statusCode = 200) {
        this.mockLineageDefinitionWithUrl(DUMMY_LAPIS_URL, fieldName, response, statusCode);
    }

    mockLineageDefinitionWithUrl(lapisUrl: string, fieldName: string, response: LineageDefinition, statusCode = 200) {
        this.workerOrServer.use(
            http.get(`${lapisUrl}/sample/lineageDefinition/${fieldName}`, resolver([{ statusCode, response }])),
        );
    }

    mockPostNucleotideMutations(
        body: Record<string, unknown>,
        response: { data: { mutation: string; count: number }[] },
        statusCode = 200,
    ) {
        this.workerOrServer.use(
            http.post(`${DUMMY_LAPIS_URL}/sample/nucleotideMutations`, resolver([{ statusCode, body, response }])),
        );
    }

    mockPostNucleotideMutationsMulti(cases: MockCase[]) {
        this.workerOrServer.use(http.post(`${DUMMY_LAPIS_URL}/sample/nucleotideMutations`, resolver(cases)));
    }

    mockPostAminoAcidMutations(
        body: Record<string, unknown>,
        response: { data: { mutation: string; count: number }[] },
        statusCode = 200,
    ) {
        this.workerOrServer.use(
            http.post(`${DUMMY_LAPIS_URL}/sample/aminoAcidMutations`, resolver([{ statusCode, body, response }])),
        );
    }

    mockPostAminoAcidMutationsMulti(cases: MockCase[]) {
        this.workerOrServer.use(http.post(`${DUMMY_LAPIS_URL}/sample/aminoAcidMutations`, resolver(cases)));
    }
}

export class BackendRouteMocker {
    constructor(private workerOrServer: MSWWorkerOrServer) {}

    mockGetSubscriptions(requestParam: { userId: string }, response: SubscriptionResponse[], statusCode = 200) {
        this.workerOrServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, resolver([{ statusCode, response, requestParam }])),
        );
    }

    mockGetEvaluateTrigger(
        requestParam: { userId: string; id: string },
        response: TriggerEvaluationResponse,
        statusCode = 200,
    ) {
        this.workerOrServer.use(
            http.get(
                `${DUMMY_BACKEND_URL}/subscriptions/evaluateTrigger`,
                resolver([{ statusCode, response, requestParam }]),
            ),
        );
    }

    mockPostSubscription(
        body: SubscriptionRequest,
        requestParam: { userId: string },
        response: SubscriptionResponse,
        statusCode = 200,
    ) {
        this.workerOrServer.use(
            http.post(`${DUMMY_BACKEND_URL}/subscriptions`, resolver([{ statusCode, body, response, requestParam }])),
        );
    }

    mockPutSubscription(
        body: SubscriptionPutRequest,
        requestParam: { userId: string },
        pathVariables: { subscriptionId: string },
        response: SubscriptionResponse,
        statusCode = 200,
    ) {
        this.workerOrServer.use(
            http.put(
                `${DUMMY_BACKEND_URL}/subscriptions/${pathVariables.subscriptionId}`,
                resolver([{ statusCode, body, response, requestParam }]),
            ),
        );
    }

    mockDeleteSubscription(
        requestParam: { userId: string },
        pathVariables: { subscriptionId: string },
        statusCode = 204,
    ) {
        this.workerOrServer.use(
            http.delete(
                `${DUMMY_BACKEND_URL}/subscriptions/${pathVariables.subscriptionId}`,
                resolver([{ statusCode, requestParam }]),
            ),
        );
    }

    mockGetSubscriptionsBackendError(response: ProblemDetail | { notProblemDetail: string }, statusCode = 400) {
        this.workerOrServer.use(
            http.get(`${DUMMY_BACKEND_URL}/subscriptions`, () => {
                return new Response(JSON.stringify(response), { status: statusCode });
            }),
        );
    }
}

function resolver(cases: MockCase[]) {
    return async ({ request }: { request: StrictRequest<DefaultBodyType> }) => {
        const actualRequestParam = new URL(request.url).searchParams;
        const actualBody = await request.json().catch(() => undefined);

        const errors: string[] = [];

        for (const { body, requestParam, response, statusCode } of cases) {
            try {
                if (requestParam !== undefined) {
                    for (const [key, value] of Object.entries(requestParam)) {
                        expect(actualRequestParam.get(key), `Request param ${key} did not match`).to.equal(value);
                    }
                    for (const [key, value] of actualRequestParam) {
                        expect(requestParam[key], `Request param ${key} was not expected`).to.equal(value);
                    }
                }
                if (body !== undefined) {
                    expect(actualBody, 'Request body did not match').to.deep.equal(body);
                }

                return new Response(JSON.stringify(response), { status: statusCode ?? 200 });
            } catch (err) {
                errors.push(getError(err));
            }
        }

        return new Response(JSON.stringify({ errors }), { status: 400 });
    };
}

function getError(error: unknown) {
    const e = error as { message: string; expected?: unknown; actual?: unknown };
    return `${e.message} - expected: ${JSON.stringify(e.expected)} - actual ${JSON.stringify(e.actual)}`;
}

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
    measles: {
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
