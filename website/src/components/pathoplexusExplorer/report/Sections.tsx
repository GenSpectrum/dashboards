import type { FC, ReactNode } from 'react';

import {
    Bar,
    ChartLegend,
    Figure,
    Prose,
    ReportLink,
    restLabel,
    Subsection,
    sumOf,
    Table,
    withRest,
} from './Layout.tsx';
import { type AreaCount, type AreaScale } from './areaScale.ts';
import {
    DATE_PRECISION,
    precisionOf,
    type DatePrecision,
    type Granularity,
} from '../../../pathoplexusExplorer/domain/dates.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import {
    HOST_GROUP,
    HOST_GROUP_LABELS,
    hostGroupOf,
    type HostGroup,
} from '../../../pathoplexusExplorer/domain/hosts.ts';
import { formatCount, formatProportion, LOW_COUNT } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import { METADATA_FIELDS } from '../../../pathoplexusExplorer/mappingData/metadataFields.ts';
import { hrefOf, type Period } from '../../../pathoplexusExplorer/reports/kinds.ts';
import { availabilityKey, CREDITS_SHOWN, type RankedValues } from '../../../pathoplexusExplorer/reports/useReports.ts';
import type { Part } from '../../../pathoplexusExplorer/rhydb/breakdown.ts';
import type { Loadable } from '../../../pathoplexusExplorer/rhydb/hooks/analyses.ts';
import type { ProportionRows } from '../../../pathoplexusExplorer/rhydb/hooks/genomics.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/rhydb/queries/scope.ts';
import { bucketAxisOf, countsPerBucket, trimEmptyBuckets } from '../../../pathoplexusExplorer/rhydb/timeSeries.ts';
import { readOptionalText, type RhydbRow } from '../../../pathoplexusExplorer/rhydb/transport/row.ts';
import { AvailabilityBars, type AvailabilityRow } from '../charts/AvailabilityBars.tsx';
import { ProportionOverTime } from '../charts/ProportionOverTime.tsx';
import { BAR_SCALE, StackedBars, type BarScale, type StackedSeries } from '../charts/StackedBars.tsx';
import { colorMap, NO_DATA_COLOR, OTHER_COLOR, SEQUENTIAL, SERIES_COLORS } from '../charts/colors.ts';
import { Async } from '../ui/States.tsx';

function nothingToPlot(rows: readonly RhydbRow[]): string {
    const total = rows.reduce((sum, row) => sum + Number(row.n ?? 0), 0);
    return total === 0 ? 'Nothing.' : 'No sequence has a collection date that is precise enough to include.';
}

const SHOWN = 10;

/** Distinguish undated entries, ranges too wide for a bucket, and entries outside the chart extent. */
function leftOut(left: { undated: number; imprecise: number; offAxis: number }): string | undefined {
    const total = left.undated + left.imprecise + left.offAxis;
    return total === 0
        ? undefined
        : `${formatCount(total)} ${total === 1 ? 'sequence' : 'sequences'} could not be shown.`;
}

const REST_KEY = '(rest)';

type CompositionRow = { key: string; label: string; n: number; target?: Part['target'] };

type CompositionProps = {
    parts: readonly Part[];
    total: number;
    caption?: React.ReactNode;
    what: string;
    linkOf?: (part: CompositionRow) => React.ReactNode;
};

export const Composition: FC<CompositionProps> = ({ parts, total, caption, what, linkOf }) => {
    // Keep the unassigned category separate from Other.
    const values = parts.filter((part) => !part.residual);
    const unplaced = parts.filter((part) => part.residual);
    const top = Math.max(1, ...parts.map((part) => part.n));
    const rows: CompositionRow[] = [
        ...withRest<CompositionRow>(values, SHOWN, (left) => ({
            key: REST_KEY,
            label: restLabel(left.length, what, `${what}s`),
            n: sumOf(left, (part) => part.n),
        })),
        ...unplaced,
    ];
    return (
        <Table
            columns={[
                {
                    header: capitalized(what),
                    cell: (row) =>
                        linkOf !== undefined && row.key !== REST_KEY ? (
                            linkOf(row)
                        ) : (
                            <ReportLink muted={row.key === REST_KEY}>{row.label}</ReportLink>
                        ),
                },
                { header: 'Sequences', align: 'right', width: 'w-24', cell: (row) => formatCount(row.n) },
                {
                    header: 'Proportion',
                    align: 'right',
                    width: 'w-20',
                    cell: (row) => (total === 0 ? '—' : formatProportion(row.n / total)),
                },
                {
                    header: '',
                    width: 'w-40',
                    cell: (row) => (
                        <Bar value={row.n} of={top} color={row.key === REST_KEY ? OTHER_COLOR : undefined} />
                    ),
                },
            ]}
            rows={rows}
            keyOf={(row) => row.key}
            footnote={caption}
        />
    );
};

type OverTimeProps = {
    rows: Loadable<RhydbRow[]>;
    parts: readonly Part[];
    classify: (row: RhydbRow) => string;
    title: string;
    caption?: React.ReactNode;
    scale?: BarScale;
    granularity?: Granularity;
};

export const OverTime: FC<OverTimeProps> = ({
    rows,
    parts,
    classify,
    title,
    caption,
    scale = BAR_SCALE.count,
    granularity,
}) => {
    return (
        <Figure title={title} caption={caption}>
            <Async state={rows} height='h-[240px]'>
                {(data) => {
                    const axis = bucketAxisOf({ rows: data, granularity });
                    if (axis === undefined) {
                        return <Prose>{nothingToPlot(data)}</Prose>;
                    }
                    const trimmed = trimEmptyBuckets(data, axis);
                    const colors = colorMap(parts.map((part) => part.key));
                    const keys = new Set(colors.keys());
                    const series: StackedSeries[] = parts.flatMap((part) => {
                        const color = colors.get(part.key);
                        return color === undefined
                            ? []
                            : [
                                  {
                                      key: part.key,
                                      label: part.label,
                                      color,
                                      values: countsPerBucket(
                                          data.filter((row) => classify(row) === part.key),
                                          trimmed.buckets,
                                          trimmed.granularity,
                                      ).counts,
                                  },
                              ];
                    });
                    const othersRows = data.filter((row) => !keys.has(classify(row)));
                    if (othersRows.length > 0) {
                        series.push({
                            key: '(other)',
                            label: 'Other',
                            color: OTHER_COLOR,
                            values: countsPerBucket(othersRows, trimmed.buckets, trimmed.granularity).counts,
                        });
                    }
                    const left = countsPerBucket(data, trimmed.buckets, trimmed.granularity);
                    return (
                        <div className='flex flex-col gap-2'>
                            <StackedBars
                                buckets={trimmed.buckets}
                                series={series}
                                scale={scale}
                                height={230}
                                xTitle={`Collection period (${trimmed.granularity})`}
                                yTitle={scale === BAR_SCALE.proportion ? 'Proportion of the period' : 'Sequences'}
                            />
                            <ChartLegend
                                items={series.map((entry) => ({ label: entry.label, color: entry.color }))}
                                note={leftOut(left)}
                            />
                        </div>
                    );
                }}
            </Async>
        </Figure>
    );
};

type AreasTableProps = {
    scale: AreaScale;
    areas: readonly AreaCount[];
    period: Period;
    countHeader: string;
    ofHeader?: string;
    total?: number;
    footnote?: ReactNode;
    linkTo?: (place: Place) => string;
};

/** Report the count missing at the geographic level used by the table. */
export function unplacedNote(unplaced: number, total: number): ReactNode {
    if (unplaced <= 0) {
        return undefined;
    }
    return (
        <strong>
            {formatCount(unplaced)} {unplaced === 1 ? 'sequence is' : 'sequences are'} not in the table (
            {formatProportion(unplaced / Math.max(1, total))}).
        </strong>
    );
}

const SHOWN_AREAS = 12;

export const AreasTable: FC<AreasTableProps> = ({
    scale,
    areas,
    period,
    countHeader,
    ofHeader,
    total = 0,
    footnote,
    linkTo,
}) => {
    const ofOwn = ofHeader !== undefined;
    const top = Math.max(1, ...areas.map((area) => area.own));
    return (
        <Table
            columns={[
                {
                    header: capitalized(scale.singular),
                    cell: (row) => (
                        <ReportLink
                            href={
                                row.place === undefined
                                    ? undefined
                                    : (linkTo?.(row.place) ?? hrefOf({ kind: 'location', where: row.place, period }))
                            }
                            muted
                        >
                            {row.name}
                        </ReportLink>
                    ),
                },
                { header: countHeader, align: 'right', width: 'w-24', cell: (row) => formatCount(row.own) },
                ...(ofOwn
                    ? [
                          {
                              header: ofHeader,
                              align: 'right' as const,
                              width: 'w-24',
                              cell: (row: AreaCount) => formatCount(row.all),
                          },
                      ]
                    : []),
                {
                    header: 'Proportion',
                    align: 'right',
                    width: 'w-20',
                    cell: (row) =>
                        ofOwn ? (
                            row.all < LOW_COUNT ? (
                                <span className='text-stone-400'>too few</span>
                            ) : (
                                formatProportion(row.own / row.all)
                            )
                        ) : total === 0 ? (
                            '—'
                        ) : (
                            formatProportion(row.own / total)
                        ),
                },
                {
                    header: '',
                    width: ofOwn ? 'w-24' : 'w-40',
                    cell: (row) =>
                        ofOwn ? (
                            <Bar value={row.all < LOW_COUNT ? undefined : row.own} of={Math.max(1, row.all)} />
                        ) : (
                            <Bar value={row.own} of={top} color={row.place === undefined ? OTHER_COLOR : undefined} />
                        ),
                },
            ]}
            rows={withRest(areas, SHOWN_AREAS, (left) => ({
                name: restLabel(left.length, scale.singular, scale.plural),
                own: sumOf(left, (entry) => entry.own),
                all: sumOf(left, (entry) => entry.all),
            }))}
            keyOf={(row) => row.name}
            footnote={footnote}
        />
    );
};

type ProportionFigureProps = {
    title: string;
    state: Loadable<ProportionRows>;
    label: string;
    legend?: string;
    yTitle: string;
};

export const ProportionFigure: FC<ProportionFigureProps> = ({ title, state, label, legend, yTitle }) => {
    return (
        <Figure title={title}>
            <Async state={state} height='h-[220px]'>
                {(rows) => {
                    const axis = bucketAxisOf({ rows: rows.all });
                    if (axis === undefined) {
                        return <Prose>{nothingToPlot(rows.all)}</Prose>;
                    }
                    const trimmed = trimEmptyBuckets(rows.all, axis);
                    const own = countsPerBucket(rows.own, trimmed.buckets, trimmed.granularity);
                    const all = countsPerBucket(rows.all, trimmed.buckets, trimmed.granularity);
                    const color = SERIES_COLORS[0];
                    return (
                        <div className='flex flex-col gap-2'>
                            <ProportionOverTime
                                buckets={trimmed.buckets}
                                series={[
                                    {
                                        key: 'own',
                                        label,
                                        color,
                                        counts: trimmed.buckets.map((_, index) => ({
                                            own: own.counts[index],
                                            all: all.counts[index],
                                        })),
                                    },
                                ]}
                                height={220}
                                xTitle={`Collection period (${trimmed.granularity})`}
                                yTitle={yTitle}
                            />
                            <ChartLegend
                                items={[
                                    { label: legend ?? label, color, shape: 'line' },
                                    { label: '95% interval', color, shape: 'band' },
                                ]}
                                note={leftOut(all)}
                            />
                        </div>
                    );
                }}
            </Async>
        </Figure>
    );
};

type HostsProps = { rows: Loadable<RhydbRow[]>; total: number };

const NAMED_HOSTS = 3;

const NAMED_GROUPS: readonly HostGroup[] = [HOST_GROUP.vector, HOST_GROUP.animal];

function hostLabel(group: HostGroup, names: ReadonlyMap<string, number>): string {
    const label = HOST_GROUP_LABELS[group];
    if (!NAMED_GROUPS.includes(group) || names.size === 0) {
        return label;
    }
    const top = [...names.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, NAMED_HOSTS)
        .map(([name, n]) => `${name} (${formatCount(n)})`);
    return `${label} (${top.join(', ')}${names.size > top.length ? ', \u2026' : ''})`;
}

type HostRow = { group: HostGroup; n: number; names: Map<string, number> };

export const Hosts: FC<HostsProps> = ({ rows, total }) => {
    return (
        <Async state={rows} height='h-24'>
            {(data) => {
                const counts = new Map<HostGroup, HostRow>();
                for (const row of data) {
                    const name = readOptionalText(row, COLUMNS.host);
                    const n = Number(row.n ?? 0);
                    const group = hostGroupOf(name, readOptionalText(row, COLUMNS.hostTaxon));
                    const entry = counts.get(group) ?? { group, n: 0, names: new Map<string, number>() };
                    entry.n += n;
                    if (name !== null) {
                        entry.names.set(name, (entry.names.get(name) ?? 0) + n);
                    }
                    counts.set(group, entry);
                }
                return (
                    <Table
                        columns={[
                            { header: 'Host', cell: (row) => hostLabel(row.group, row.names) },
                            {
                                header: 'Sequences',
                                align: 'right',
                                width: 'w-24',
                                cell: (row) => formatCount(row.n),
                            },
                            {
                                header: 'Proportion',
                                align: 'right',
                                width: 'w-20',
                                cell: (row) => (total === 0 ? '\u2014' : formatProportion(row.n / total)),
                            },
                        ]}
                        rows={[...counts.values()].sort((a, b) => b.n - a.n)}
                        keyOf={(row) => row.group}
                    />
                );
            }}
        </Async>
    );
};

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

type SubmittersProps = {
    groups: Loadable<RhydbRow[]>;
    authors: Loadable<RankedValues>;
    affiliations: Loadable<RankedValues>;
    total: number;
};

export const Submitters: FC<SubmittersProps> = ({ groups, authors, affiliations, total }) => {
    return (
        <>
            <Subsection title='Submitting groups'>
                <CreditTable
                    state={countedFrom(groups, groupsOf)}
                    heading='Submitting group'
                    singular='group'
                    plural='groups'
                    shown={SHOWN_GROUPS}
                    total={total}
                />
            </Subsection>
            <Subsection title='Author affiliations'>
                <CreditTable
                    state={rankedFrom(affiliations, COLUMNS.affiliations)}
                    heading='Affiliations'
                    singular='affiliation'
                    plural='affiliations'
                    total={total}
                />
            </Subsection>
            <Subsection title='Authors'>
                <CreditTable
                    state={rankedFrom(authors, COLUMNS.authors)}
                    heading='Authors'
                    singular='author list'
                    plural='author lists'
                    total={total}
                />
            </Subsection>
        </>
    );
};

type Ranked = { entries: CreditRow[]; values: number; total: number };

function rankedFrom(state: Loadable<RankedValues>, column: string): Loadable<Ranked> {
    const data = state.data;
    return {
        ...state,
        data:
            data === undefined
                ? undefined
                : { entries: creditRows(data.rows, column), values: data.values, total: data.total },
    };
}

function countedFrom(state: Loadable<RhydbRow[]>, count: (rows: readonly RhydbRow[]) => CreditRow[]): Loadable<Ranked> {
    const entries = state.data === undefined ? undefined : count(state.data);
    return {
        ...state,
        data:
            entries === undefined
                ? undefined
                : { entries, values: entries.length, total: sumOf(entries, (entry) => entry.n) },
    };
}

const SHOWN_GROUPS = 8;

type CreditRow = {
    label: string;
    n: number;
    rest?: boolean;
};

type CreditTableProps = {
    state: Loadable<Ranked>;
    heading: string;
    singular: string;
    plural: string;
    shown?: number;
    total: number;
};

const CreditTable: FC<CreditTableProps> = ({ state, heading, singular, plural, shown = CREDITS_SHOWN, total }) => {
    return (
        <Async state={state} height='h-24'>
            {(data) => {
                const printed = data.entries.slice(0, shown);
                const left = data.values - printed.length;
                const top = Math.max(1, ...printed.map((entry) => entry.n));
                return (
                    <Table
                        columns={[
                            {
                                header: heading,
                                cell: (row) => <ReportLink muted={row.rest === true}>{row.label}</ReportLink>,
                            },
                            {
                                header: 'Sequences',
                                align: 'right',
                                width: 'w-24',
                                cell: (row) => formatCount(row.n),
                            },
                            {
                                header: 'Proportion',
                                align: 'right',
                                width: 'w-20',
                                cell: (row) => (total === 0 ? '\u2014' : formatProportion(row.n / total)),
                            },
                            {
                                header: '',
                                width: 'w-32',
                                cell: (row) => (
                                    <Bar value={row.n} of={top} color={row.rest === true ? OTHER_COLOR : undefined} />
                                ),
                            },
                        ]}
                        rows={
                            left <= 0
                                ? printed
                                : [
                                      ...printed,
                                      {
                                          label: restLabel(left, singular, plural),
                                          n: data.total - sumOf(printed, (entry) => entry.n),
                                          rest: true,
                                      },
                                  ]
                        }
                        keyOf={(row) => row.label}
                    />
                );
            }}
        </Async>
    );
};

/** Group by the complete credit field as recorded, including full author lists. */
function creditRows(rows: readonly RhydbRow[], column: string): CreditRow[] {
    return rows
        .map((row) => ({ label: readOptionalText(row, column) ?? 'Not recorded', n: Number(row.n ?? 0) }))
        .filter((entry) => entry.n > 0)
        .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

/** Group submitters by ID because registered groups can share a name. */
function groupsOf(rows: readonly RhydbRow[]): CreditRow[] {
    const groups = new Map<string, { name: string | null; n: number }>();
    for (const row of rows) {
        const id = (row[COLUMNS.group] ?? null) as string | number | null;
        const key = id === null ? '' : String(id);
        const entry = groups.get(key) ?? { name: (row[COLUMNS.groupName] ?? null) as string | null, n: 0 };
        entry.n += Number(row.n ?? 0);
        groups.set(key, entry);
    }
    const groupsPerName = new Map<string, number>();
    for (const { name } of groups.values()) {
        if (name !== null) {
            groupsPerName.set(name, (groupsPerName.get(name) ?? 0) + 1);
        }
    }
    return [...groups.entries()]
        .filter(([, entry]) => entry.n > 0)
        .map(([key, entry]) => ({
            label:
                entry.name === null
                    ? 'Not recorded'
                    : (groupsPerName.get(entry.name) ?? 0) > 1
                      ? `${entry.name} (group ${key})`
                      : entry.name,
            n: entry.n,
        }))
        .sort((a, b) => b.n - a.n);
}
