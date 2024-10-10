import { z } from 'zod';

export namespace EvaluationInterval {
    export const daily = 'daily';
    export const weekly = 'weekly';
    export const monthly = 'monthly';
}

export const evaluationIntervalConfig = {
    [EvaluationInterval.daily]: {
        label: 'Daily',
    },
    [EvaluationInterval.weekly]: {
        label: 'Weekly',
    },
    [EvaluationInterval.monthly]: {
        label: 'Monthly',
    },
};

export type EvaluationInterval = keyof typeof evaluationIntervalConfig;

export const allEvaluationIntervals = Object.keys(evaluationIntervalConfig) as EvaluationInterval[];

export const evaluationIntervalSchema = z.enum(
    Object.keys(evaluationIntervalConfig) as [keyof typeof evaluationIntervalConfig],
);
