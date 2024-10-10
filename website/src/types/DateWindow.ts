import dayjs, { type Dayjs } from 'dayjs';
import { z } from 'zod';

export const DateWindows = {
    last6Months: 'last6Months' as const,
    last2Weeks: 'last2Weeks' as const,
};

export const dateWindowConfig = {
    [DateWindows.last6Months]: {
        label: 'Last 6 months',
    },
    [DateWindows.last2Weeks]: {
        label: 'Last 2 weeks',
    },
};

export type DateWindow = keyof typeof dateWindowConfig;

export const allDateWindows = Object.keys(dateWindowConfig) as DateWindow[];

export const dateWindowSchema = z.enum(Object.keys(dateWindowConfig) as [keyof typeof dateWindowConfig]);

export function getStartDate(dateWindow: DateWindow): Dayjs {
    const startDate = dayjs();
    switch (dateWindow) {
        case DateWindows.last6Months:
            return startDate.subtract(6, 'month');
        case DateWindows.last2Weeks:
            return startDate.subtract(14, 'day');
    }
}
