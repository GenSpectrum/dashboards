import type { FC } from 'react';

import { ChartLegend, Figure } from './Layout.tsx';
import type { Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import { availabilityKey } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/columns.ts';
import { readOptionalText, type RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { DATE_PRECISION, precisionOf, type DatePrecision } from '../../../pathoplexusExplorer/domain/dates.ts';
import { METADATA_FIELDS } from '../../../pathoplexusExplorer/mappingData/metadataFields.ts';
import { AvailabilityBars, type AvailabilityRow } from '../reportCharts/AvailabilityBars.tsx';
import { Async } from '../ui/States.tsx';
import { NO_DATA_COLOR, SEQUENTIAL } from '../ui/colors.ts';

type MetadataAvailabilityProps = {
    availability: Loadable<RhydbRow[]>;
    /** Use collection date ranges to count each level of precision. */
    dates: Loadable<readonly RhydbRow[]>;
};

const PRECISION_COLORS: Readonly<Record<DatePrecision, string>> = {
    day: SEQUENTIAL[5],
    month: SEQUENTIAL[3],
    year: SEQUENTIAL[1],
    wider: SEQUENTIAL[0],
    none: NO_DATA_COLOR,
};

const PRECISION_ORDER: readonly DatePrecision[] = [
    DATE_PRECISION.day,
    DATE_PRECISION.month,
    DATE_PRECISION.year,
    DATE_PRECISION.wider,
];

export const MetadataAvailability: FC<MetadataAvailabilityProps> = ({ availability, dates }) => {
    const counts = availability.data?.[0];
    const state = {
        data: counts === undefined || dates.data === undefined ? undefined : { counts, dates: dates.data },
        error: availability.error ?? dates.error,
    };
    return (
        <Figure>
            <Async state={state} height='h-40'>
                {(data) => {
                    const total = Number(data.counts.n ?? 0);
                    const precision = precisionCounts(data.dates);
                    const rows: AvailabilityRow[] = [
                        {
                            key: 'collectionDate',
                            label: 'Collection date',
                            segments: PRECISION_ORDER.map((step) => ({
                                key: step,
                                n: precision.get(step) ?? 0,
                                color: PRECISION_COLORS[step],
                            })),
                        },
                        ...METADATA_FIELDS.map((field, index) => ({
                            key: field.column,
                            label: field.label,
                            segments: [
                                {
                                    key: field.column,
                                    n: Number(data.counts[availabilityKey(index)] ?? 0),
                                    color: PRECISION_COLORS.day,
                                },
                            ],
                        })),
                    ];
                    return (
                        <div className='flex flex-col gap-2'>
                            <AvailabilityBars rows={rows} total={total} />
                            <ChartLegend
                                items={[
                                    { label: 'recorded', color: PRECISION_COLORS.day },
                                    { label: 'date to the month', color: PRECISION_COLORS.month },
                                    { label: 'date to the year', color: PRECISION_COLORS.year },
                                    { label: 'date wider than a year', color: PRECISION_COLORS.wider },
                                    { label: 'not recorded', color: NO_DATA_COLOR },
                                ]}
                            />
                        </div>
                    );
                }}
            </Async>
        </Figure>
    );
};

function precisionCounts(rows: readonly RhydbRow[]): Map<DatePrecision, number> {
    const counts = new Map<DatePrecision, number>();
    for (const row of rows) {
        const step = precisionOf(readOptionalText(row, COLUMNS.lower), readOptionalText(row, COLUMNS.upper));
        counts.set(step, (counts.get(step) ?? 0) + Number(row.n ?? 0));
    }
    return counts;
}
