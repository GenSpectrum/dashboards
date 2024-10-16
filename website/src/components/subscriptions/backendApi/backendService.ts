import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { z, type ZodSchema } from 'zod';

import { type ProblemDetail, problemDetailSchema } from '../../../types/ProblemDetail.ts';
import {
    type SubscriptionPutRequest,
    type SubscriptionRequest,
    subscriptionResponseSchema,
    triggerEvaluationResponseSchema,
} from '../../../types/Subscription.ts';

class ApiService {
    private readonly axiosInstance: AxiosInstance;

    constructor(baseURL: string) {
        this.axiosInstance = axios.create({ baseURL });
    }

    public async get<Response>(
        url: string,
        requestParams: Record<string, string>,
        schema: ZodSchema<Response>,
    ): Promise<Response> {
        return this.handleRequest({ url, method: 'get', params: requestParams }, schema);
    }

    public async post<Request, Response>(
        url: string,
        data: Request,
        requestParams: Record<string, string>,
        schema: ZodSchema<Response>,
    ): Promise<Response> {
        return this.handleRequest({ url, method: 'post', params: requestParams, data }, schema);
    }

    public async put<Request, Response>(
        url: string,
        data: Request,
        requestParams: Record<string, string>,
        schema: ZodSchema<Response>,
    ): Promise<Response> {
        return this.handleRequest({ url, method: 'put', params: requestParams, data }, schema);
    }

    public async delete<Response>(
        url: string,
        requestParams: Record<string, string>,
        schema: ZodSchema<Response>,
    ): Promise<Response> {
        return this.handleRequest({ url, method: 'delete', params: requestParams }, schema);
    }

    private async handleRequest<Request, Response>(request: AxiosRequestConfig<Request>, schema: ZodSchema<Response>) {
        try {
            const response = await this.axiosInstance.request(request);
            return schema.parse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    await this.handleErrors(error.response);
                }

                if (error.code === axiosNotFoundError) {
                    throw new BackendNotAvailable(error.config?.baseURL ?? '');
                }
            }
            throw error;
        }
    }

    private async handleErrors(response: AxiosResponse) {
        if (response.status >= 300 || response.status < 200) {
            const backendError = problemDetailSchema.safeParse(response.data);
            if (backendError.success) {
                throw new BackendError(
                    response.statusText,
                    response.status,
                    backendError.data,
                    response.config.url ?? '',
                );
            }

            throw new UnknownBackendError(response.statusText, response.status, response.config.url ?? '');
        }
    }
}

const axiosNotFoundError = 'ENOTFOUND';

export class BackendError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly problemDetail: ProblemDetail,
        public readonly requestedData: string,
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

export class BackendNotAvailable extends Error {
    constructor(url: string) {
        super(`Backend not available under ${url}`);
        this.name = 'BackendNotAvailable';
    }
}

export class BackendService extends ApiService {
    constructor(backendUrl: string) {
        super(backendUrl);
    }

    public async getSubscriptions(userId: string) {
        const url = `/subscriptions`;
        return this.get(url, { userId }, z.array(subscriptionResponseSchema));
    }

    public async getEvaluateTrigger(subscriptionId: string, userId: string) {
        const url = `/subscriptions/evaluateTrigger`;
        return this.get(url.toString(), { userId, id: subscriptionId }, triggerEvaluationResponseSchema);
    }

    public async postSubscription(subscription: SubscriptionRequest, userId: string) {
        const url = `/subscriptions`;
        return this.post(url, subscription, { userId }, subscriptionResponseSchema);
    }

    public async putSubscription(subscription: SubscriptionPutRequest, userId: string, subscriptionId: string) {
        const url = `/subscriptions/${subscriptionId}`;
        return this.put(url, subscription, { userId }, subscriptionResponseSchema);
    }

    public async deleteSubscription(subscriptionId: string, userId: string) {
        const url = `/subscriptions/${subscriptionId}`;
        return this.delete(
            url,
            { userId },
            z.literal('').refine((input): input is never => true),
        );
    }
}

let backendServiceForClientside: BackendService | null = null;

export function getBackendServiceForClientside(): BackendService {
    if (!backendServiceForClientside) {
        backendServiceForClientside = new BackendService(`${new URL(window.location.href).origin}/api`);
    }
    return backendServiceForClientside;
}
