import { notificationChannels, subscriptionsResponse, triggerEvaluationResponses } from './dummyDataFromBackend.ts';
import type { Subscription, TriggerEvaluationResponse } from '../../types/Subscription.ts';
import type { NotificationChannels } from '../../types/NotificationChannels.ts';

export function fetchSubscriptions() {
    return subscriptionsResponse;
}

export function fetchSubscriptionEvaluateTrigger(id: string): TriggerEvaluationResponse {
    switch (id) {
        case '1':
            return triggerEvaluationResponses['1'];
        case '2':
            return triggerEvaluationResponses['2'];
        case '3':
            return triggerEvaluationResponses['3'];
        default:
            return {
                result: {
                    message: 'Subscription not found',
                    statusCode: 404,
                    type: 'EvaluationError',
                },
            };
    }
}

export function fetchNotificationChannels(): NotificationChannels {
    return notificationChannels;
}

export function buildSubscriptions(): Subscription[] {
    const subscriptionResponses = fetchSubscriptions();
    const allNotificationChannels = fetchNotificationChannels();

    return subscriptionResponses.map((subscriptionResponse) => {
        const triggerEvaluationResponse = fetchSubscriptionEvaluateTrigger(subscriptionResponse.id);
        const notificationChannels = {
            slack: subscriptionResponse.notificationChannelIds.slack.map((id) =>
                allNotificationChannels.slack.find((channel) => channel.id === id),
            ) as NotificationChannels['slack'],
            email: subscriptionResponse.notificationChannelIds.email.map((id) =>
                allNotificationChannels.email.find((channel) => channel.id === id),
            ) as NotificationChannels['email'],
        };

        return {
            ...subscriptionResponse,
            triggerEvaluationResult: triggerEvaluationResponse.result,
            notificationChannels,
        };
    });
}
