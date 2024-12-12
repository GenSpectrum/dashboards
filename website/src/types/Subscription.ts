import { z } from 'zod';

import { dateWindowSchema } from './DateWindow.ts';
import { evaluationIntervalSchema } from './EvaluationInterval.ts';
import { organismSchema } from './Organism.ts';

export const lapisFilterSchema = z.record(
    z.union([z.string(), z.number(), z.null(), z.undefined(), z.boolean(), z.array(z.string())]),
);

const triggerEvaluationConditionMetSchema = z.object({
    evaluatedValue: z.number(),
    threshold: z.number(),
    type: z.literal('ConditionMet'),
    lapisDataVersion: z.string().optional(),
});

const triggerEvaluationConditionNotMetSchema = z.object({
    evaluatedValue: z.number(),
    threshold: z.number(),
    type: z.literal('ConditionNotMet'),
    lapisDataVersion: z.string().optional(),
});

const triggerEvaluationErrorSchema = z.object({
    type: z.literal('EvaluationError'),
    message: z.string(),
    statusCode: z.number(),
});

export const triggerEvaluationResultSchema = z.discriminatedUnion('type', [
    triggerEvaluationConditionMetSchema,
    triggerEvaluationConditionNotMetSchema,
    triggerEvaluationErrorSchema,
]);
type TriggerEvaluationResult = z.infer<typeof triggerEvaluationResultSchema>;

export const triggerEvaluationResponseSchema = z.object({
    result: triggerEvaluationResultSchema,
});
export type TriggerEvaluationResponse = z.infer<typeof triggerEvaluationResponseSchema>;

export const countTriggerSchema = z.object({
    type: z.literal('count'),
    count: z.number(),
    filter: lapisFilterSchema,
});
export type CountTrigger = z.infer<typeof countTriggerSchema>;

export const proportionTriggerSchema = z.object({
    type: z.literal('proportion'),
    proportion: z.number(),
    numeratorFilter: lapisFilterSchema,
    denominatorFilter: lapisFilterSchema,
});
export type ProportionTrigger = z.infer<typeof proportionTriggerSchema>;

const triggerSchema = z.discriminatedUnion('type', [countTriggerSchema, proportionTriggerSchema]);
export type Trigger = z.infer<typeof triggerSchema>;

// TODO: Enable notificationChannels in #82, #128
// const notificationChannelIdsSchema = z.object({
//     slack: z.array(z.string()),
//     email: z.array(z.string()),
// });
// export type NotificationChannelIds = z.infer<typeof notificationChannelIdsSchema>;

export const subscriptionRequestSchema = z.object({
    name: z.string(),
    active: z.boolean(),
    interval: evaluationIntervalSchema,
    trigger: triggerSchema,
    organism: organismSchema,
    dateWindow: dateWindowSchema,
    // TODO: Enable notificationChannels in #82, #128
    // notificationChannelIds: notificationChannelIdsSchema,
});
export type SubscriptionRequest = z.infer<typeof subscriptionRequestSchema>;

export const subscriptionPutRequestSchema = subscriptionRequestSchema.partial();
export type SubscriptionPutRequest = z.infer<typeof subscriptionPutRequestSchema>;

export const subscriptionResponseSchema = subscriptionRequestSchema.extend({
    id: z.string(),
});
export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;

export interface Subscription extends SubscriptionResponse {
    triggerEvaluationResult: TriggerEvaluationResult;
    // TODO: Enable notificationChannels in #82, #128
    // notificationChannels: NotificationChannels;
}
