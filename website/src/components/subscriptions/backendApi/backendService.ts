import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { z, type ZodSchema } from 'zod';

import { type ProblemDetail, problemDetailSchema } from '../../../types/ProblemDetail.ts';
import {
    type SubscriptionPutRequest,
    type SubscriptionRequest,
    subscriptionResponseSchema,
    triggerEvaluationResponseSchema,
} from '../../../types/Subscription.ts';
import { UserFacingError } from '../../ErrorReportInstruction.tsx';

const X_REQUEST_ID_HEADER = 'x-request-id';

type EndpointParameters<Response> = {
    url: string;
    requestParams: Record<string, string>;
    schema: ZodSchema<Response>;
};

type EndpointParametersWithBody<Request, Response> = EndpointParameters<Response> & { data: Request };

class ApiService {
    private readonly axiosInstance: AxiosInstance;

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({ baseURL });
    }

    public async get<Response>({ url, requestParams, schema }: EndpointParameters<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'get', params: requestParams }, schema);
    }

    public async post<Request, Response>({
        url,
        data,
        requestParams,
        schema,
    }: EndpointParametersWithBody<Request, Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'post', params: requestParams, data }, schema);
    }

    public async put<Request, Response>({
        url,
        data,
        requestParams,
        schema,
    }: EndpointParametersWithBody<Request, Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'put', params: requestParams, data }, schema);
    }

    public async delete<Response>({ url, requestParams, schema }: EndpointParameters<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'delete', params: requestParams }, schema);
    }

    private async handleRequest<Request, Response>(request: AxiosRequestConfig<Request>, schema: ZodSchema<Response>) {
        try {
            const response = await this.axiosInstance.request(request);
            return schema.parse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    this.handleErrors(error.response);
                }

                if (error.code === axiosNotFoundError) {
                    throw new BackendNotAvailable(error.config?.baseURL ?? '');
                }
            }
            throw error;
        }
    }

    private handleErrors(response: AxiosResponse) {
        if (response.status >= 300 || response.status < 200) {
            const backendError = problemDetailSchema.safeParse(response.data);
            if (backendError.success) {
                throw new BackendError(
                    backendError.data.detail ?? '(no detail)',
                    response.status,
                    backendError.data,
                    response.config.url ?? '',
                    response.headers[X_REQUEST_ID_HEADER],
                );
            }

            throw new UnknownBackendError(response.statusText, response.status, response.config.url ?? '');
        }
    }
}

const axiosNotFoundError = 'ENOTFOUND';

export class BackendError extends UserFacingError {
    constructor(
        message: string,
        public readonly status: number,
        public readonly problemDetail: ProblemDetail,
        public readonly requestedData: string,
        public readonly requestId: string | undefined,
    ) {
        super(message);
        this.name = 'BackendError';
    }
}

export class UnknownBackendError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly requestedData: string,
    ) {
        super(message);
        this.name = 'UnknownBackendError';
    }
}

export class BackendNotAvailable extends UserFacingError {
    constructor(url: string) {
        super(`Backend not available under ${url}`);
        this.name = 'BackendNotAvailable';
    }
}

export class BackendService extends ApiService {
    public async getSubscriptions({ userId }: { userId: string }) {
        const url = `/subscriptions`;
        return this.get({ url, requestParams: { userId }, schema: z.array(subscriptionResponseSchema) });
    }

    public async getEvaluateTrigger({ subscriptionId, userId }: { subscriptionId: string; userId: string }) {
        const url = `/subscriptions/evaluateTrigger`;
        return this.get({
            url: url.toString(),
            requestParams: { userId, id: subscriptionId },
            schema: triggerEvaluationResponseSchema,
        });
    }

    public async postSubscription({ subscription, userId }: { subscription: SubscriptionRequest; userId: string }) {
        const url = `/subscriptions`;
        return this.post({ url, data: subscription, requestParams: { userId }, schema: subscriptionResponseSchema });
    }

    public async putSubscription({
        subscription,
        userId,
        subscriptionId,
    }: {
        subscription: SubscriptionPutRequest;
        userId: string;
        subscriptionId: string;
    }) {
        const url = `/subscriptions/${subscriptionId}`;
        return this.put({
            url,
            data: subscription,
            requestParams: { userId },
            schema: subscriptionResponseSchema,
        });
    }

    public async deleteSubscription({ subscriptionId, userId }: { subscriptionId: string; userId: string }) {
        const url = `/subscriptions/${subscriptionId}`;
        return this.delete({
            url,
            requestParams: { userId },
            schema: z.literal('').refine((input): input is never => true),
        });
    }
}

let backendServiceForClientside: BackendService | null = null;

export function getBackendServiceForClientside(): BackendService {
    backendServiceForClientside ??= new BackendService(`${new URL(window.location.href).origin}/api`);
    return backendServiceForClientside;
}
