import type { Subscription } from '../../../types/Subscription.ts';
import { BackendService } from './backendService.ts';

// export function fetchNotificationChannels(): NotificationChannels {
//     return {
//         slack: [],
//         email: [],
//     };
// }

export async function querySubscriptions(userId: string, backendService: BackendService): Promise<Subscription[]> {
    const subscriptionResponses = await backendService.getSubscriptions(userId);
    // const allNotificationChannels = fetchNotificationChannels();

    return await Promise.all(
        subscriptionResponses.map(async (subscriptionResponse) => {
            const triggerEvaluationResult = await backendService.getEvaluateTrigger(subscriptionResponse.id, userId);
            // const notificationChannels = {
            //     slack: subscriptionResponse.notificationChannelIds.slack.map((id) =>
            //         allNotificationChannels.slack.find((channel) => channel.id === id),
            //     ) as NotificationChannels['slack'],
            //     email: subscriptionResponse.notificationChannelIds.email.map((id) =>
            //         allNotificationChannels.email.find((channel) => channel.id === id),
            //     ) as NotificationChannels['email'],
            // };

            return {
                ...subscriptionResponse,
                triggerEvaluationResult: triggerEvaluationResult.result,
                // notificationChannels,
            };
        }),
    );
}
