import { type FC, useMemo } from 'react';

import { AreasTable, unplacedNote } from './AreasTable.tsx';
import { Citation } from './Citation.tsx';
import { ProportionFigure } from './DistributionOverTime.tsx';
import { GenomePosition } from './GenomePosition.tsx';
import { Bar, KeyFigures, Prose, ReportLink, restLabel, Section, Table, withRest } from './Layout.tsx';
import { nomenclatureNote } from './Nomenclature.tsx';
import { ReportMap } from './ReportMap.tsx';
import { ReportMetadataSections } from './ReportMetadataSections.tsx';
import { ReportShell } from './ReportShell.tsx';
import { plural, spreadFigure } from './areaScale.ts';
import { useMapCounts, useSubtypeColumns } from '../../../pathoplexusExplorer/dataLayer/hooks/analyses.ts';
import { firstErrorOf, type Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import type { Genome } from '../../../pathoplexusExplorer/dataLayer/hooks/useGenome.ts';
import {
    useMutationReads,
    useCoverageByGroup,
    type MutationCheck,
    type MutationSubject,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useMutation.ts';
import { useReportMetadata } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { areaScale, hasPlacesBelow, areaCounts } from '../../../pathoplexusExplorer/dataLayer/queries/areas.ts';
import {
    mutationBreakdownLevel,
    lineageCounts,
    type LineageCount,
} from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/columns.ts';
import type { PositionReading } from '../../../pathoplexusExplorer/dataLayer/queries/positions.ts';
import { countryCounts, groupsIn } from '../../../pathoplexusExplorer/dataLayer/queries/summary.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import { UNASSIGNED } from '../../../pathoplexusExplorer/domain/lineages.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount, formatProportion, LOW_COUNT, sumOf } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { subjectLabel, subjectTitle, type Subject } from '../../../pathoplexusExplorer/domain/subject.ts';
import { singleMutationOf } from '../../../pathoplexusExplorer/domain/variant.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { Async, ErrorMessage, Loading } from '../ui/States.tsx';
import { OTHER_COLOR } from '../ui/colors.ts';

const SHOWN = 12;

function formatOrWait(count: number | undefined): string {
    return count === undefined ? '…' : formatCount(count);
}

const COUNTRY_ONLY = [COLUMNS.country];
const COUNTRY_AND_AREA = [COLUMNS.country, COLUMNS.admin1];
const PERIOD_BY = [COLUMNS.lower, COLUMNS.upper];
const NO_LEVEL: string[] = [];
const LINEAGE_BY = (column: string | undefined) => (column === undefined ? NO_LEVEL : [column]);
const AREA_BY = (where: Place) => (where.level === 'country' ? COUNTRY_AND_AREA : COUNTRY_ONLY);

type MutationReportProps = {
    reference: ReportRef & { kind: 'mutations' };
    entries: ReportEntries;
    check: MutationCheck;
};

/** Count nothing until the query is known to resolve on the reference genome. */
export const MutationReport: FC<MutationReportProps> = ({ reference, entries, check }) => {
    const { subject, genome, beyondGenome } = check;
    const message = subject.data?.error ?? beyondGenome;
    if (message !== undefined) {
        return (
            <ReportShell reference={reference}>
                <Prose>{message}</Prose>
            </ReportShell>
        );
    }
    const resolved = subject.data?.subject;
    const error = firstErrorOf([subject, genome]);
    if (resolved === undefined || genome.data === undefined || error !== null) {
        return (
            <ReportShell reference={reference}>
                {error === null ? <Loading /> : <ErrorMessage error={error} />}
            </ReportShell>
        );
    }
    return <MutationReportBody reference={reference} entries={entries} subject={resolved} genome={genome.data} />;
};

type MutationReportBodyProps = {
    reference: ReportRef & { kind: 'mutations' };
    entries: ReportEntries;
    subject: MutationSubject;
    genome: Genome;
};

const MutationReportBody: FC<MutationReportBodyProps> = ({ reference, entries, subject, genome }) => {
    const { where, period, what } = reference;
    const available = useSubtypeColumns(CATALOG);
    const columns = available.data;
    const level = useMemo(
        () => (columns === undefined ? undefined : mutationBreakdownLevel(what, columns)),
        [what, columns],
    );
    const reads = useMutationReads({
        what,
        where,
        query: reference.query,
        period,
        subject,
        column: level?.column,
        reference: genome,
        catalog: CATALOG,
    });
    const own = { ...reads.resolved, data: reads.resolved.data?.[0] };
    const all = { ...reads.resolved, data: reads.resolved.data?.[1] };
    const map = useMapCounts(where, own, all);
    const metadata = useReportMetadata(own);
    const datedRows = { ...reads.proportion, data: reads.proportion.data?.own };

    const positions = reads.positions.data ?? [];
    const single = singleMutationOf(subject.node) !== undefined && positions.length === 1 ? positions[0] : undefined;
    // Use the coverage denominator only for a single mutation.
    const byLineage = useCoverageByGroup(all, subject, genome, LINEAGE_BY(level?.column), single !== undefined);
    const byArea = useCoverageByGroup(all, subject, genome, AREA_BY(where), single !== undefined);
    const byPeriod = useCoverageByGroup(all, subject, genome, PERIOD_BY, single !== undefined);
    const covered = single !== undefined;
    const proportionOverTime = covered ? byPeriod : reads.proportion;
    const carriers = reads.proportion.data;
    const carrierTotal = sumOf(carriers?.own ?? [], (row) => Number(row.n ?? 0));
    const baseTotal = sumOf(carriers?.all ?? [], (row) => Number(row.n ?? 0));

    const classification = covered ? byLineage : reads.carriers;
    const lineages = useMemo(
        () => lineageCounts(classification.data, level?.column, what),
        [classification.data, level, what],
    );
    const scale = useMemo(() => areaScale(where), [where]);
    const geographicRows = useMemo(() => {
        if (covered) {
            return byArea.data;
        }
        return map.data === undefined ? undefined : { own: map.data.rows, all: map.data.parentRows ?? map.data.rows };
    }, [covered, byArea.data, map.data]);
    const areas = useMemo(() => areaCounts(scale, geographicRows, covered), [scale, geographicRows, covered]);
    const geographicCarriers = sumOf(geographicRows?.own ?? [], (row) => Number(row.n ?? 0));

    const error = firstErrorOf([reads.resolved, reads.carriers, reads.proportion, ...Object.values(metadata)]);

    if (reads.positions.data === undefined) {
        return (
            <ReportShell reference={reference}>
                {reads.positions.error === null ? <Loading /> : <ErrorMessage error={reads.positions.error} />}
            </ReportShell>
        );
    }

    return (
        <ReportShell reference={reference}>
            {error !== null && <ErrorMessage error={error} />}

            <DatasetSection
                reference={reference}
                entries={entries}
                counted={carriers !== undefined}
                carrierTotal={carrierTotal}
                baseTotal={baseTotal}
                positionCount={positions.length}
                single={single}
                map={map.data}
                groups={metadata.groups.data}
            />

            <Section number={2} title='Position on the genome'>
                <GenomePosition genome={genome} readings={positions} />
            </Section>

            <ClassificationSection
                available={available}
                level={level}
                what={what}
                where={where}
                period={period}
                state={{ ...classification, data: lineages }}
                covered={covered}
            />

            <Section number={4} title='Distribution over time'>
                <ProportionFigure
                    title='Proportion over time'
                    state={proportionOverTime}
                    label={reference.query}
                    legend={`${reference.query}, proportion of ${subjectTitle(what)} sequences${covered ? ' with coverage' : ''}`}
                    yTitle={covered ? 'Proportion with coverage' : `Proportion of ${subjectTitle(what)}`}
                />
            </Section>

            <Section number={5} title='Geographic distribution'>
                <ReportMap where={where} counts={map} legend={`Sequences with ${reference.query}`} />
                {hasPlacesBelow(where) && (
                    <Async state={{ data: areas, error: covered ? byArea.error : map.error }} height='h-32'>
                        {(data) => (
                            <AreasTable
                                scale={scale}
                                linkTo={(place) =>
                                    hrefOf({ kind: 'mutations', what, where: place, query: reference.query, period })
                                }
                                areas={data}
                                footnote={unplacedNote(
                                    geographicCarriers - sumOf(data, (area) => area.own),
                                    geographicCarriers,
                                )}
                                period={period}
                                countHeader='Count'
                                ofHeader={covered ? 'Coverage' : 'Sequences'}
                            />
                        )}
                    </Async>
                )}
            </Section>

            <ReportMetadataSections first={6} metadata={metadata} dates={datedRows} />
        </ReportShell>
    );
};

type DatasetSectionProps = {
    reference: ReportRef & { kind: 'mutations' };
    entries: ReportEntries;
    counted: boolean;
    carrierTotal: number;
    baseTotal: number;
    positionCount: number;
    single: PositionReading | undefined;
    map: { rows: RhydbRow[]; parentRows: RhydbRow[] | undefined } | undefined;
    groups: RhydbRow[] | undefined;
};

const DatasetSection: FC<DatasetSectionProps> = ({
    reference,
    entries,
    counted,
    carrierTotal,
    baseTotal,
    positionCount,
    single,
    map,
    groups,
}) => {
    const what = reference.what;
    return (
        <Section
            number={1}
            title='Dataset'
            lead={
                !counted ? (
                    `Counting the ${subjectTitle(what)} sequences that have ${reference.query}…`
                ) : (
                    <>
                        <strong>{formatCount(carrierTotal)}</strong> {subjectTitle(what)}{' '}
                        {carrierTotal === 1 ? 'sequence has' : 'sequences have'} {reference.query}, out of{' '}
                        {formatCount(baseTotal)} in the selection.
                        {single !== undefined && single.read > 0 && (
                            <>
                                {' '}
                                The position has coverage in {formatCount(single.read)} sequences,{' '}
                                {formatProportion(single.carriers / single.read)} of which have the mutation.
                                {single.absent + single.ambiguous > 0 &&
                                    ` In ${formatCount(single.absent + single.ambiguous)} it is uncovered.`}
                            </>
                        )}
                        {positionCount > 1 &&
                            ` Each of the ${formatCount(positionCount)} positions is counted against the sequences covering it.`}
                        <Citation reference={reference} entries={entries} />
                    </>
                )
            }
        >
            <KeyFigures
                figures={[
                    { label: 'Sequences', value: counted ? formatCount(carrierTotal) : '…' },
                    ...(single === undefined
                        ? []
                        : [
                              {
                                  label: 'Proportion with coverage',
                                  value: single.read === 0 ? '—' : formatProportion(single.carriers / single.read),
                                  note:
                                      single.read === 0
                                          ? 'no sequence covers the position'
                                          : `of ${formatCount(single.read)} sequences`,
                              },
                          ]),
                    spreadFigure(
                        reference.where,
                        map?.rows,
                        map === undefined ? undefined : countryCounts(map.rows).size,
                    ),
                    {
                        label: 'Submitting groups',
                        value: formatOrWait(groups === undefined ? undefined : groupsIn(groups)),
                    },
                ]}
            />
        </Section>
    );
};

type ClassificationSectionProps = {
    available: Loadable<unknown>;
    level: { column: string; label: string } | undefined;
    what: Subject;
    where: Place;
    period: Period;
    state: Loadable<(LineageCount & { rest?: boolean })[]>;
    covered: boolean;
};

const ClassificationSection: FC<ClassificationSectionProps> = ({
    available,
    level,
    what,
    where,
    period,
    state,
    covered,
}) => (
    <Section
        number={3}
        title={level === undefined ? 'Classification' : plural(level.label)}
        lead={level === undefined ? undefined : nomenclatureNote(what)}
    >
        {available.data === undefined ? (
            <Async state={available} height='h-32'>
                {() => null}
            </Async>
        ) : level === undefined ? (
            <Prose>
                {what.kind === 'subtype'
                    ? `This report is already about ${subjectLabel(what)}, which the data has no finer level below.`
                    : 'This pathogen has no classification in the data.'}
            </Prose>
        ) : (
            <Async state={state} height='h-32'>
                {(lineages) => (
                    <Table
                        columns={[
                            {
                                header: level.label,
                                cell: (row) => (
                                    <ReportLink
                                        href={
                                            row.what === undefined
                                                ? undefined
                                                : hrefOf({ kind: 'lineage', what: row.what, where, period })
                                        }
                                        muted={row.rest === true}
                                    >
                                        {labelOfValue(row.value)}
                                    </ReportLink>
                                ),
                            },
                            { header: 'Count', align: 'right', width: 'w-20', cell: (row) => formatCount(row.own) },
                            {
                                header: covered ? 'Coverage' : 'Sequences',
                                align: 'right',
                                width: 'w-24',
                                cell: (row) => formatCount(row.all),
                            },
                            {
                                header: 'Proportion',
                                align: 'right',
                                width: 'w-20',
                                cell: (row) => (row.all === 0 ? '—' : formatProportion(row.own / row.all)),
                            },
                            {
                                header: '',
                                width: 'w-24',
                                cell: (row) => (
                                    <Bar
                                        value={row.all < LOW_COUNT ? undefined : row.own}
                                        of={Math.max(1, row.all)}
                                        color={row.rest === true ? OTHER_COLOR : undefined}
                                    />
                                ),
                            },
                        ]}
                        rows={withRest(lineages, SHOWN, (left) => ({
                            value: restLabel(left.length, level.label.toLowerCase(), `${level.label.toLowerCase()}s`),
                            own: sumOf(left, (entry) => entry.own),
                            all: sumOf(left, (entry) => entry.all),
                            rest: true,
                        }))}
                        keyOf={(row) => row.value}
                    />
                )}
            </Async>
        )}
    </Section>
);

function labelOfValue(value: string): string {
    return value === UNASSIGNED ? 'Unassigned' : value;
}
