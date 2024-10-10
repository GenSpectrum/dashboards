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

    public async get<Response>(url: string, schema: ZodSchema<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'get' }, schema);
    }

    public async post<Request, Response>(url: string, data: Request, schema: ZodSchema<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'post', data }, schema);
    }

    public async put<Request, Response>(url: string, data: Request, schema: ZodSchema<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'put', data }, schema);
    }
    public async delete<Response>(url: string, schema: ZodSchema<Response>): Promise<Response> {
        return this.handleRequest({ url, method: 'delete' }, schema);
    }

    private async handleRequest<Request, Response>(request: AxiosRequestConfig<Request>, schema: ZodSchema<Response>) {
        try {
            const response = await this.axiosInstance.request(request);
            await this.handleErrors(response);
            return schema.parse(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    await this.handleErrors(error.response);
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

class BackendError extends Error {
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

class UnknownBackendError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly requestedData: string,
    ) {
        super(message);
        this.name = 'UnknownBackendError';
    }
}

export class BackendService extends ApiService {
    constructor(backendUrl: string) {
        super(backendUrl);
    }

    public async getSubscriptions(userId: string) {
        const url = `/subscriptions?userId=${userId}`;
        return this.get(url, z.array(subscriptionResponseSchema));
    }

    public async getEvaluateTrigger(subscriptionId: string, userId: string) {
        const url = `/subscriptions/evaluateTrigger?userId=${userId}&id=${subscriptionId}`;
        return this.get(url.toString(), triggerEvaluationResponseSchema);
    }

    public async postSubscription(subscription: SubscriptionRequest, userId: string) {
        const url = `/subscriptions?userId=${userId}`;
        return this.post(url, subscription, subscriptionResponseSchema);
    }

    public async putSubscription(subscription: SubscriptionPutRequest, userId: string, subscriptionId: string) {
        const url = `/subscriptions/${subscriptionId}?userId=${userId}`;
        return this.put(url, subscription, subscriptionResponseSchema);
    }

    public async deleteSubscription(subscriptionId: string, userId: string) {
        const url = `/subscriptions/${subscriptionId}?userId=${userId}`;
        return this.delete(
            url,
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
