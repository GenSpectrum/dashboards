import type { Organism } from '../routes/View.ts';
import type { DateWindow } from './DateWindow.ts';

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

export interface Subscription extends SubscriptionResponse {
    conditionsMet: boolean;
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
