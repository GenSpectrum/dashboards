import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';

import type { WasapPageConfig } from './wasapPageConfig';
import { getDateRange } from '../../../lapis/getDateRange';
import { recentDaysDateRangeOptions } from '../../../util/recentDaysDateRangeOptions';
import {
    defaultSamplingDateRange,
    isUnresolvedSamplingDate,
} from '../../../views/pageStateHandlers/WasapPageStateHandler';

/**
 * Resolves a `samplingDate` that may just be a preset label (e.g. "Most recent 14 days", from a
 * URL loaded fresh) into concrete dates, by fetching the dataset's actual date range and matching
 * the label against the same options `DynamicDateFilter` generates for the dropdown.
 *
 * If `samplingDate` already has concrete dates, this returns it immediately without any network
 * request — only label-only values pay for the round trip.
 */
export function useResolvedSamplingDate(
    config: WasapPageConfig,
    samplingDateFromPageState: DateRangeOption | undefined,
): { samplingDate: DateRangeOption; isPending: boolean } {
    const samplingDate = samplingDateFromPageState ?? defaultSamplingDateRange();
    const needsResolution = isUnresolvedSamplingDate(samplingDate);

    const {
        data: dateRange,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['dateRange', config.lapisBaseUrl, config.samplingDateField],
        queryFn: () => getDateRange(config.lapisBaseUrl, config.samplingDateField),
        enabled: needsResolution,
    });

    if (!needsResolution) {
        return { samplingDate, isPending: false };
    }

    if (isPending) {
        return { samplingDate, isPending: true };
    }

    if (isError) {
        return { samplingDate: defaultSamplingDateRange(), isPending: false };
    }

    const options = recentDaysDateRangeOptions({ startDate: dateRange.start, endDate: dateRange.end });
    const resolved = options.find((option) => option.label === samplingDate.label);

    return { samplingDate: resolved ?? defaultSamplingDateRange(), isPending: false };
}
