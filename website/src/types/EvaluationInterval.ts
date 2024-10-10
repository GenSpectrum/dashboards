import { z } from 'zod';

export const EvaluationIntervals = {
    daily: 'daily' as const,
    weekly: 'weekly' as const,
    monthly: 'monthly' as const,
};

export const evaluationIntervalConfig = {
    [EvaluationIntervals.daily]: {
        label: 'Daily',
    },
    [EvaluationIntervals.weekly]: {
        label: 'Weekly',
    },
    [EvaluationIntervals.monthly]: {
        label: 'Monthly',
    },
};

export type EvaluationInterval = keyof typeof evaluationIntervalConfig;

export const allEvaluationIntervals = Object.keys(evaluationIntervalConfig) as EvaluationInterval[];

export const evaluationIntervalSchema = z.enum(
    Object.keys(evaluationIntervalConfig) as [keyof typeof evaluationIntervalConfig],
);
