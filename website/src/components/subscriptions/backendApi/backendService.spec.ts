import { describe, expect, test } from 'vitest';

import { BackendError, BackendNotAvailable, BackendService, UnknownBackendError } from './backendService.ts';
import { backendRequestMocks, DUMMY_BACKEND_URL } from '../../../../vitest.setup.ts';
import type {
    SubscriptionRequest,
    SubscriptionResponse,
    TriggerEvaluationResponse,
} from '../../../types/Subscription.ts';

describe('backendService', () => {
    const backendService = new BackendService(DUMMY_BACKEND_URL);

    test('should GET subscriptions', async () => {
        const userId = '123';

        const subscriptions: SubscriptionResponse[] = [
            {
                id: '1',
                name: 'Subscription 1',
                active: true,
                interval: 'daily',
                organism: 'covid',
                dateWindow: 'last6Months',
                trigger: {
                    type: 'count',
                    count: 100,
                    filter: { country: 'Germany' },
                },
            },
            {
                id: '2',
                name: 'Subscription 2',
                active: false,
                interval: 'weekly',
                organism: 'h5n1',
                dateWindow: 'last2Weeks',
                trigger: {
                    type: 'proportion',
                    proportion: 0.1,
                    numeratorFilter: { country: 'Germany' },
                    denominatorFilter: { country: 'Germany' },
                },
            },
        ];

        backendRequestMocks.getSubscriptions({ userId }, subscriptions);

        await expect(backendService.getSubscriptions(userId)).resolves.to.deep.equal(subscriptions);
    });

    const evaluateTriggerResponses: { description: string; evaluationResult: TriggerEvaluationResponse }[] = [
        {
            description: 'ConditionMet',
            evaluationResult: {
                result: {
                    type: 'ConditionMet',
                    evaluatedValue: 100,
                    threshold: 99,
                    lapisDataVersion: '12345',
                },
            },
        },
        {
            description: 'ConditionNotMet',
            evaluationResult: {
                result: {
                    type: 'ConditionNotMet',
                    evaluatedValue: 0.99,
                    threshold: 1.0,
                    lapisDataVersion: '12345',
                },
            },
        },
        {
            description: 'EvaluationError',
            evaluationResult: {
                result: {
                    type: 'EvaluationError',
                    message: 'Some error message',
                    statusCode: 500,
                },
            },
        },
    ];

    test.each(evaluateTriggerResponses)(
        'should GET evaluate trigger for type $description',
        async ({ evaluationResult }) => {
            const userId = '123';
            const subscriptionId = '1';

            backendRequestMocks.getEvaluateTrigger({ userId, id: subscriptionId }, evaluationResult);

            await expect(backendService.getEvaluateTrigger(subscriptionId, userId)).resolves.to.deep.equal(
                evaluationResult,
            );
        },
    );

    test('should POST subscription', async () => {
        const userId = '123';
        const subscription: SubscriptionRequest = {
            name: 'Subscription 1',
            active: true,
            interval: 'daily',
            organism: 'covid',
            dateWindow: 'last6Months',
            trigger: {
                type: 'count',
                count: 100,
                filter: { country: 'Germany' },
            },
        };

        const response: SubscriptionResponse = {
            id: '1',
            ...subscription,
        };

        backendRequestMocks.postSubscription(subscription, { userId }, response);
        await expect(backendService.postSubscription(subscription, userId)).resolves.to.deep.equal(response);
    });

    test('should PUT subscription', async () => {
        const userId = '123';
        const subscriptionId = '1';
        const subscription = {
            name: 'Subscription 1',
            active: false,
            interval: 'daily' as const,
            organism: 'covid' as const,
            dateWindow: 'last6Months' as const,
            trigger: {
                type: 'count' as const,
                count: 100,
                filter: { country: 'Germany' },
            },
        };

        const response: SubscriptionResponse = {
            id: subscriptionId,
            ...subscription,
        };

        backendRequestMocks.putSubscription(subscription, { userId }, { subscriptionId }, response);
        await expect(backendService.putSubscription(subscription, userId, subscriptionId)).resolves.to.deep.equal(
            response,
        );
    });

    test('should DELETE subscription', async () => {
        const userId = '123';
        const subscriptionId = '1';

        backendRequestMocks.deleteSubscription({ userId }, { subscriptionId });
        await expect(backendService.deleteSubscription(subscriptionId, userId)).resolves.to.deep.equal('');
    });

    test('should throw error when backend is not reachable', async () => {
        await expect(backendService.getSubscriptions('123')).rejects.to.deep.equal(
            new BackendNotAvailable(DUMMY_BACKEND_URL),
        );
    });

    test('should pass backend error response from GET subscriptions', async () => {
        const errorResponse = { detail: 'Some error detail' };

        backendRequestMocks.getSubscriptionsBackendError(errorResponse, 400);

        await expect(backendService.getSubscriptions('123')).rejects.to.deep.equal(
            new BackendError('Bad Request', 400, errorResponse, '/subscriptions'),
        );
    });

    test('should pass unknown error response from GET subscriptions', async () => {
        const errorResponse = { notProblemDetail: 'Some error detail' };

        backendRequestMocks.getSubscriptionsBackendError(errorResponse, 400);

        await expect(backendService.getSubscriptions('123')).rejects.to.deep.equal(
            new UnknownBackendError('Bad Request', 400, '/subscriptions'),
        );
    });
});
