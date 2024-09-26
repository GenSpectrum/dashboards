import type { Organism } from '../routes/View.ts';
import type { DateWindow } from './DateWindow.ts';
import type { NotificationChannels } from './NotificationChannels.ts';

export type LapisFilter = Record<string, string | number | null | boolean | undefined | string[]>;

export type EvaluationInterval = 'daily' | 'weekly' | 'monthly';

export type CountTrigger = {
    type: 'count';
    count: number;
    filter: LapisFilter;
};

export type ProportionTrigger = {
    type: 'proportion';
    proportion: number;
    numeratorFilter: LapisFilter;
    denominatorFilter: LapisFilter;
};

export type Trigger = CountTrigger | ProportionTrigger;

export type TriggerEvaluationResponse = {
    result: TriggerEvaluationResult;
};

export type TriggerEvaluationResult =
    | {
          evaluatedValue: number;
          threshold: number;
          lapisDataVersion?: string;
          type: 'ConditionMet' | 'ConditionNotMet';
      }
    | EvaluationError;

export type EvaluationError = {
    type: 'EvaluationError';
    message: string;
    statusCode: number;
};

export interface Subscription extends SubscriptionResponse {
    triggerEvaluationResult: TriggerEvaluationResult;
    notificationChannels: NotificationChannels;
}

export interface SubscriptionResponse extends SubscriptionRequest {
    id: string;
}

export interface SubscriptionRequest {
    name: string;
    active: boolean;
    interval: EvaluationInterval;
    trigger: Trigger;
    organism: Organism;
    dateWindow: DateWindow;
    notificationChannelIds: {
        slack: string[];
        email: string[];
    };
}
