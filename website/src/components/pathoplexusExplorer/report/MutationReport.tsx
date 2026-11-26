import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { GenomePosition } from './GenomePosition.tsx';
import { Bar, KeyFigures, Prose, ReportLink, restLabel, Section, sumOf, Table, withRest } from './Layout.tsx';
import { nomenclatureNote } from './Nomenclature.tsx';
import { ReportMap } from './ReportMap.tsx';
import { ReportShell } from './ReportShell.tsx';
import { AreasTable, Hosts, MetadataAvailability, ProportionFigure, Submitters } from './Sections.tsx';
import {
    areaScale,
    countriesIn,
    groupsIn,
    hasPlacesBelow,
    plural,
    rankAreas,
    spreadFigure,
    type AreaCount,
    type AreaScale,
} from './areaScale.ts';
import {
    firstErrorOf,
    useHostCounts,
    useMapCounts,
    useSubtypeColumns,
    type Loadable,
} from '../../../pathoplexusExplorer/dataLayer/hooks/analyses.ts';
import type { ProportionRows } from '../../../pathoplexusExplorer/dataLayer/hooks/genomics.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import type { Genome } from '../../../pathoplexusExplorer/dataLayer/hooks/useGenome.ts';
import {
    useMutationReads,
    useSymbolGroups,
    type MutationCheck,
    type MutationSubject,
    type PositionReading,
    type SymbolGroup,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useMutation.ts';
import {
    useAffiliations,
    useAuthors,
    useMetadataAvailability,
    useSubmittingGroups,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useReports.ts';
import { COLUMNS } from '../../../pathoplexusExplorer/dataLayer/queries/scope.ts';
import type { RhydbRow } from '../../../pathoplexusExplorer/dataLayer/transport/row.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import { normalizeSubtype, UNASSIGNED } from '../../../pathoplexusExplorer/domain/lineages.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount, formatProportion, LOW_COUNT } from '../../../pathoplexusExplorer/domain/statistics.ts';
import {
    isPathogenNode,
    subjectLabel,
    subjectTitle,
    withStep,
    type Subject,
} from '../../../pathoplexusExplorer/domain/subject.ts';
import { singleMutationOf } from '../../../pathoplexusExplorer/domain/variant.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { OTHER_COLOR } from '../charts/colors.ts';
import { Async, ErrorMessage, Loading } from '../ui/States.tsx';

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

function rowOfGroup(group: SymbolGroup): RhydbRow {
    return { [COLUMNS.country]: group.values[0] ?? null, [COLUMNS.admin1]: group.values[1] ?? null };
}

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

function useMutationReport({ reference, subject, genome }: MutationReportBodyProps) {
    const { where, period, what } = reference;
    const available = useSubtypeColumns(CATALOG);
    const columns = available.data;
    const level = useMemo(() => (columns === undefined ? undefined : breakdownLevel(what, columns)), [what, columns]);
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
    const scope = useMemo(() => ({ what, where, period }), [what, where, period]);
    const variantScope = useMemo(() => ({ ...scope, variant: reference.query }), [scope, reference.query]);
    const own = { ...reads.resolved, data: reads.resolved.data?.[0] };
    const all = { ...reads.resolved, data: reads.resolved.data?.[1] };
    const map = useMapCounts(variantScope, own, all);
    // Hosts and submitting groups are counted among sequences matching the mutation query.
    const hosts = useHostCounts(own);
    const groups = useSubmittingGroups(own);
    const authors = useAuthors(own);
    const affiliations = useAffiliations(own);
    const availability = useMetadataAvailability(own);
    const datedRows = { ...reads.proportion, data: reads.proportion.data?.[0]?.own };

    const positions = reads.positions.data ?? [];
    const single = singleMutationOf(subject.node) !== undefined && positions.length === 1 ? positions[0] : undefined;
    // Use the coverage denominator only for a single mutation.
    const byLineage = useSymbolGroups(all, subject, genome, LINEAGE_BY(level?.column), single !== undefined);
    const byArea = useSymbolGroups(all, subject, genome, AREA_BY(where), single !== undefined);
    const byPeriod = useSymbolGroups(all, subject, genome, PERIOD_BY, single !== undefined);
    const covered = single !== undefined;
    const proportionOverTime: Loadable<ProportionRows[]> = covered
        ? {
              ...byPeriod,
              data:
                  byPeriod.data === undefined
                      ? undefined
                      : [
                            {
                                own: periodRows(byPeriod.data, (group) => group.carriers),
                                all: periodRows(byPeriod.data, (group) => group.covered),
                            },
                        ],
          }
        : reads.proportion;
    const carriers = reads.proportion.data?.[0];
    const carrierTotal = (carriers?.own ?? []).reduce((sum, row) => sum + Number(row.n ?? 0), 0);
    const baseTotal = (carriers?.all ?? []).reduce((sum, row) => sum + Number(row.n ?? 0), 0);

    const lineages = useMemo(
        () =>
            covered
                ? lineagesFromSymbols(byLineage.data, level?.column, what)
                : lineagesOf(reads.carriers.data, level?.column, what),
        [covered, byLineage.data, reads.carriers.data, level, what],
    );
    const scale = useMemo(() => areaScale(where), [where]);
    const areas = useMemo(
        () => (covered ? areasFromSymbols(scale, byArea.data) : areasOf(scale, map.data)),
        [covered, scale, byArea.data, map.data],
    );

    return {
        available,
        level,
        reads,
        map,
        hosts,
        groups,
        authors,
        affiliations,
        availability,
        datedRows,
        positions,
        single,
        covered,
        proportionOverTime,
        carriers,
        carrierTotal,
        baseTotal,
        lineages,
        scale,
        areas,
    };
}

const MutationReportBody: FC<MutationReportBodyProps> = (props) => {
    const { reference, entries, genome } = props;
    const { where, period, what } = reference;
    const {
        available,
        level,
        reads,
        map,
        hosts,
        groups,
        authors,
        affiliations,
        availability,
        datedRows,
        positions,
        single,
        covered,
        proportionOverTime,
        carriers,
        carrierTotal,
        baseTotal,
        lineages,
        scale,
        areas,
    } = useMutationReport(props);

    const error = firstErrorOf([
        reads.resolved,
        reads.carriers,
        reads.proportion,
        hosts,
        groups,
        authors,
        affiliations,
        availability,
    ]);

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
                groups={groups.data}
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
                state={reads.carriers}
                lineages={lineages}
                covered={covered}
            />

            <Section number={4} title='Distribution over time'>
                <ProportionFigure
                    title='Proportion over time'
                    state={{ ...proportionOverTime, data: proportionOverTime.data?.[0] }}
                    label={reference.query}
                    legend={`${reference.query}, proportion of ${subjectTitle(what)} sequences${covered ? ' with coverage' : ''}`}
                    yTitle={covered ? 'Proportion with coverage' : `Proportion of ${subjectTitle(what)}`}
                />
            </Section>

            <Section number={5} title='Geographic distribution'>
                <ReportMap where={where} counts={map} legend={`Sequences with ${reference.query}`} />
                {hasPlacesBelow(where) && (
                    <AreasTable
                        scale={scale}
                        linkTo={(place) =>
                            hrefOf({ kind: 'mutations', what, where: place, query: reference.query, period })
                        }
                        areas={areas}
                        period={period}
                        countHeader='Count'
                        ofHeader={covered ? 'Coverage' : 'Sequences'}
                    />
                )}
            </Section>

            <Section number={6} title='Hosts'>
                <Hosts rows={hosts} total={carrierTotal} />
            </Section>

            <Section number={7} title='Metadata availability'>
                <MetadataAvailability availability={availability} dates={datedRows} />
            </Section>

            <Section number={8} title='Submitters'>
                <Submitters groups={groups} authors={authors} affiliations={affiliations} total={carrierTotal} />
            </Section>
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
                    spreadFigure(reference.where, map?.rows, countriesIn(map?.rows)),
                    { label: 'Submitting groups', value: formatOrWait(groupsIn(groups)) },
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
    state: Loadable<unknown>;
    lineages: LineageRow[] | undefined;
    covered: boolean;
};

const ClassificationSection: FC<ClassificationSectionProps> = ({
    available,
    level,
    what,
    where,
    period,
    state,
    lineages,
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
                {() => (
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
                        rows={withRest(lineages ?? [], SHOWN, (left) => ({
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

/** Break down by the first catalog level that the pathogen's table has and the report has not fixed. */
function breakdownLevel(what: Subject, columns: ReadonlySet<string>): { column: string; label: string } | undefined {
    if (!isPathogenNode(what)) {
        return undefined;
    }
    const fixed = new Set(what.kind === 'subtype' ? what.steps.map((step) => step.column) : []);
    const level = what.pathogen.levels.find(
        (candidate) => !fixed.has(candidate.column) && columns.has(`${what.pathogen.table}|${candidate.column}`),
    );
    return level === undefined ? undefined : { column: level.column, label: level.label };
}

type LineageRow = {
    value: string;
    own: number;
    all: number;
    what?: Subject;
    rest?: boolean;
};

function lineageRows(totals: ReadonlyMap<string, { own: number; all: number }>, column: string, what: Subject) {
    return [...totals.entries()]
        .map(([value, counts]) => ({
            value,
            ...counts,
            what: value === UNASSIGNED ? undefined : withStep(what, { column, value }),
        }))
        .sort((a, b) => b.own - a.own || b.all - a.all);
}

function lineagesFromSymbols(
    groups: SymbolGroup[] | undefined,
    column: string | undefined,
    what: Subject,
): LineageRow[] | undefined {
    if (groups === undefined || column === undefined) {
        return undefined;
    }
    const totals = new Map<string, { own: number; all: number }>();
    for (const group of groups) {
        const value = normalizeSubtype(group.values[0]);
        const entry = totals.get(value) ?? { own: 0, all: 0 };
        entry.own += group.carriers;
        entry.all += group.covered;
        totals.set(value, entry);
    }
    return lineageRows(totals, column, what);
}

function areasFromSymbols(scale: AreaScale, groups: SymbolGroup[] | undefined): AreaCount[] {
    return rankAreas(
        scale,
        (groups ?? []).map((group) => ({ row: rowOfGroup(group), own: group.carriers, all: group.covered })),
    );
}

function periodRows(groups: SymbolGroup[] | undefined, count: (group: SymbolGroup) => number): RhydbRow[] {
    return (groups ?? []).map((group) => ({
        [COLUMNS.lower]: group.values[0],
        [COLUMNS.upper]: group.values[1],
        n: count(group),
    }));
}

function lineagesOf(
    carriers: { own: readonly RhydbRow[]; all: readonly RhydbRow[] } | undefined,
    column: string | undefined,
    what: Subject,
): LineageRow[] | undefined {
    if (carriers === undefined || column === undefined) {
        return undefined;
    }
    const sum = (rows: readonly RhydbRow[]) => {
        const counts = new Map<string, number>();
        for (const row of rows) {
            const value = normalizeSubtype((row[column] ?? null) as string | null);
            counts.set(value, (counts.get(value) ?? 0) + Number(row.n ?? 0));
        }
        return counts;
    };
    const own = sum(carriers.own);
    const totals = new Map([...sum(carriers.all)].map(([value, all]) => [value, { own: own.get(value) ?? 0, all }]));
    return lineageRows(totals, column, what);
}

function labelOfValue(value: string): string {
    return value === UNASSIGNED ? 'Unassigned' : value;
}

function areasOf(
    scale: AreaScale,
    map: { rows: RhydbRow[]; parentRows: RhydbRow[] | undefined } | undefined,
): AreaCount[] {
    if (map === undefined) {
        return [];
    }
    const n = (row: RhydbRow) => Number(row.n ?? 0);
    return rankAreas(scale, [
        ...map.rows.map((row) => ({ row, own: n(row), all: 0 })),
        ...(map.parentRows ?? map.rows).map((row) => ({ row, own: 0, all: n(row) })),
    ]).filter((area) => area.own > 0);
}
