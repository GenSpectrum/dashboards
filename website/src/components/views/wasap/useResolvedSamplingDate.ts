import { type DateRangeOption } from '@genspectrum/dashboard-components/util';
import { useQuery } from '@tanstack/react-query';

import type { WasapPageConfig } from './wasapPageConfig';
import { getDateRange } from '../../../lapis/getDateRange';
import { ALL_TIMES_LABEL } from '../../../util/defaultDateRangeOption';
import { recentDaysDateRangeOptions } from '../../../util/recentDaysDateRangeOptions';
import { isUnresolvedSamplingDate } from '../../../views/pageStateHandlers/WasapPageStateHandler';

const allTimes: DateRangeOption = { label: ALL_TIMES_LABEL };

/**
 * Resolves a `samplingDate` that may just be a preset label (e.g. "Most recent 14 days", from a
 * URL loaded fresh) into concrete dates, by fetching the dataset's actual date range and matching
 * the label against the same options `DynamicDateFilter` generates for the dropdown.
 *
 * If `samplingDate` already has concrete dates, this returns it immediately without any network
 * request — only label-only values pay for the round trip. If the dataset's date range can't be
 * fetched, or the label doesn't match any known option, this falls back to "All times" rather than
 * guessing a window — simpler than a synthetic wall-clock default, and the safest thing to show
 * when we can't tell what data actually exists.
 */
export function useResolvedSamplingDate(
    config: WasapPageConfig,
    samplingDateFromPageState: DateRangeOption | undefined,
): { samplingDate: DateRangeOption; isPending: boolean } {
    const samplingDate = samplingDateFromPageState ?? allTimes;
    const needsResolution = isUnresolvedSamplingDate(samplingDate);

    const {
        data: dateRange,
        isPending,
        isError,
    } = useQuery({
        queryKey: ['dateRange', config.lapisBaseUrl, config.samplingDateField],
        queryFn: () => getDateRange(config.lapisBaseUrl, config.samplingDateField),
        enabled: needsResolution,
        // Fail open to "All times" promptly rather than retrying — a hung date-range fetch
        // shouldn't stall the chart behind react-query's default retry/backoff.
        retry: false,
    });

    if (!needsResolution) {
        return { samplingDate, isPending: false };
    }

    if (isPending) {
        return { samplingDate, isPending: true };
    }

    if (isError) {
        return { samplingDate: allTimes, isPending: false };
    }

    const options = recentDaysDateRangeOptions({ startDate: dateRange.start, endDate: dateRange.end });
    const resolved = options.find((option) => option.label === samplingDate.label);

    return {
        samplingDate: resolved ?? options.find((option) => option.label === ALL_TIMES_LABEL) ?? allTimes,
        isPending: false,
    };
}
