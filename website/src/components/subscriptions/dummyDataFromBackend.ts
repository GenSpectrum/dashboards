import type { Subscription, SubscriptionResponse } from '../../types/Subscription.ts';
import type { NotificationChannels } from '../../types/NotificationChannels.ts';

export const subscriptionsResponse: SubscriptionResponse[] = [
    {
        id: '1',
        active: false,
        name: 'My search',
        interval: 'weekly',
        dateWindow: 'last6Months',
        trigger: {
            type: 'count',
            count: 10,
            filter: {
                country: 'Germany',
                ageFrom: '20',
            },
        },
        organism: 'covid',
        notificationChannelIds: {
            email: ['1'],
            slack: ['3'],
        },
    },
    {
        id: '2',
        active: true,
        name: 'My other search',
        interval: 'daily',
        dateWindow: 'last6Months',
        trigger: {
            type: 'count',
            count: 20,
            filter: { country: 'Switzerland', ageFrom: '20', pangoLineage: 'B.1.1.7' },
        },
        organism: 'covid',
        notificationChannelIds: {
            email: ['2'],
            slack: ['4'],
        },
    },
    {
        id: '3',
        active: true,
        name: 'My third search',
        interval: 'weekly',
        dateWindow: 'last6Months',
        trigger: {
            type: 'proportion',
            proportion: 13,
            numeratorFilter: {
                country: 'Germany',
                ageFrom: '20',
            },
            denominatorFilter: { country: 'Germany' },
        },
        organism: 'rsvA',
        notificationChannelIds: {
            email: ['1'],
            slack: ['3'],
        },
    },
];

export const triggerEvaluationResponses = {
    '1': {
        result: {
            evaluatedValue: 5,
            threshold: 10,
            type: 'ConditionNotMet' as const,
        },
    },
    '2': {
        result: {
            evaluatedValue: 20,
            threshold: 20,
            type: 'ConditionMet' as const,
        },
    },
    '3': {
        result: {
            evaluatedValue: 11,
            threshold: 13,
            type: 'ConditionNotMet' as const,
        },
    },
};

export const notificationChannels: NotificationChannels = {
    email: [
        {
            id: '1',
            address: 'test@test.test',
            name: 'A test email',
        },
        {
            id: '2',
            address: 'other@other.other',
            name: 'Another test email',
        },
    ],
    slack: [
        {
            id: '3',
            name: 'My slack channel',
            hook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        },
        {
            id: '4',
            name: 'My other slack channel',
            hook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
        },
    ],
};
