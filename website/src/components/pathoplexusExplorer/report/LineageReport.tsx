import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { Composition } from './Composition.tsx';
import { DistributionOverTime } from './DistributionOverTime.tsx';
import { ProportionFigure } from './DistributionOverTime.tsx';
import { GeographicDistribution } from './GeographicDistribution.tsx';
import { KeyFigures, Prose, ReportLink, Section, Table } from './Layout.tsx';
import { classificationRows, LineageTree, type TreeEntry } from './LineageTree.tsx';
import { nomenclatureNote } from './Nomenclature.tsx';
import { mapTitleOf } from './ReportMap.tsx';
import { ReportMetadataSections } from './ReportMetadataSections.tsx';
import { ReportShell } from './ReportShell.tsx';
import { plural, spreadFigure, spreadPhrase } from './areaScale.ts';
import { useLineageHierarchy } from '../../../pathoplexusExplorer/dataLayer/hooks/analyses.ts';
import { type Loadable } from '../../../pathoplexusExplorer/dataLayer/hooks/queryResult.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import {
    proportionBaseOf,
    useLineageMutations,
    useLineageProportion,
    DEFINING,
    PARENT_MAX,
    type LineageMutations,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useLineage.ts';
import { firstError, useReportData } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { collectionBoundsOf } from '../../../pathoplexusExplorer/dataLayer/queries/summary.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { collectionBoundPhrase } from '../../../pathoplexusExplorer/domain/dates.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import { NO_HIERARCHY, type Hierarchy } from '../../../pathoplexusExplorer/domain/lineages.ts';
import { comparableParentOf } from '../../../pathoplexusExplorer/domain/reference.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount, formatIndex, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import {
    effectiveSteps,
    isPathogenNode,
    subjectAncestors,
    subjectLabel,
    parentSubject,
    type PathogenNode,
    type Subject,
} from '../../../pathoplexusExplorer/domain/subject.ts';
import { mutationLabel } from '../../../pathoplexusExplorer/domain/variant.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { Async, Empty, ErrorMessage } from '../ui/States.tsx';

const SHOWN_MUTATIONS = 10;

type LineageReportProps = { reference: ReportRef & { kind: 'lineage' }; entries: ReportEntries };

export const LineageReport: FC<LineageReportProps> = ({ reference, entries }) => {
    const { period, where, what } = reference;
    const scope = useMemo(() => ({ what, where, period }), [what, where, period]);
    const report = useReportData(scope, CATALOG);
    const hierarchy = useLineageHierarchy(CATALOG).data ?? NO_HIERARCHY;
    const parent = parentSubject(what, hierarchy);
    // Compare mutations only across scopes that share the same reference.
    const comparedWith = comparableParentOf(what, hierarchy);
    const mutations = useLineageMutations({ what, where, period, catalog: CATALOG });
    const proportion = useLineageProportion({ what, where, period, catalog: CATALOG });
    const base = useMemo(() => proportionBaseOf(what), [what]);
    const error = firstError(report);
    const summary = report.summary.data;
    const dateRows = report.overTime.data;
    const dates = useMemo(() => (dateRows === undefined ? undefined : collectionBoundsOf(dateRows)), [dateRows]);
    const total = summary?.n ?? 0;
    const grouped = report.breakdown.data;
    const children = useMemo(() => grouped ?? [], [grouped]);
    const spec = report.spec.data;
    const level = spec?.title ?? 'Sublineage';
    // Fall back to geography when the lineage has no finer classification.
    const classification = spec?.of === 'classification';
    const below = children.length > 0 && !classification ? 1 : 0;

    const lineageHref = useMemo(
        () => (node: Subject) => hrefOf({ kind: 'lineage', what: node, where, period }),
        [where, period],
    );
    const ancestors = useMemo(
        () => ancestorEntries(what, hierarchy, (node) => entryHref(node, where, period, lineageHref)),
        [what, hierarchy, where, period, lineageHref],
    );
    const rows = useMemo(
        () =>
            classificationRows({
                ancestors,
                subject: { label: subjectLabel(what) },
                spec,
                parts: children,
                total: summary?.n,
                href: lineageHref,
                what: level.toLowerCase(),
            }),
        [ancestors, what, spec, children, summary?.n, lineageHref, level],
    );

    return (
        <ReportShell reference={reference}>
            {error !== null && <ErrorMessage error={error} />}

            <Section
                number={1}
                title='Dataset'
                lead={
                    summary === undefined || dates === undefined ? (
                        'Counting the sequences…'
                    ) : (
                        <>
                            <strong>Pathoplexus</strong> holds <strong>{formatCount(total)}</strong> sequences assigned
                            to {subjectLabel(what)}, {spreadPhrase(where, report.map.data?.rows, summary.countries)}
                            {dates !== null &&
                                `, the first collected ${collectionBoundPhrase(dates.firstFrom, dates.firstTo)} and the last collected ${collectionBoundPhrase(dates.lastFrom, dates.lastTo)}`}
                            .{parent !== undefined && ` It lies within ${subjectLabel(parent)}.`}
                            <Citation reference={reference} entries={entries} />
                        </>
                    )
                }
            >
                <KeyFigures
                    figures={[
                        { label: 'Sequences', value: summary === undefined ? '…' : formatCount(total) },
                        spreadFigure(where, report.map.data?.rows, summary?.countries),
                        {
                            label: 'Submitting groups',
                            value: summary === undefined ? '…' : formatCount(summary.groups),
                        },
                    ]}
                />
            </Section>

            <Section number={2} title='Lineage hierarchy' lead={nomenclatureNote(what)}>
                <LineageTree
                    rows={grouped === undefined ? undefined : rows}
                    total={summary?.n}
                    title={classification ? level : (levelOf(what) ?? level)}
                />
            </Section>

            <MutationsSection state={mutations} what={what} where={where} period={period} comparedWith={comparedWith} />

            {children.length > 0 && !classification && (
                <Section number={4} title={plural(level)}>
                    <Composition
                        parts={children}
                        total={summary?.n}
                        what={level.toLowerCase()}
                        linkOf={(part) => (
                            <ReportLink
                                href={
                                    part.target?.what?.kind === 'subtype'
                                        ? hrefOf({ kind: 'lineage', what: part.target.what, where, period })
                                        : undefined
                                }
                            >
                                {part.label}
                            </ReportLink>
                        )}
                    />
                </Section>
            )}

            <Section number={4 + below} title='Distribution over time'>
                <DistributionOverTime
                    report={report}
                    title={`Sequences${children.length > 0 ? ` by ${level.toLowerCase()}` : ''}`}
                />
                {base !== undefined && (
                    <ProportionFigure
                        title={`Proportion of ${subjectLabel(base)}`}
                        state={proportion}
                        label={subjectLabel(what)}
                        yTitle={`Proportion of ${subjectLabel(base)}`}
                    />
                )}
            </Section>

            <GeographicDistribution
                number={5 + below}
                reference={reference}
                counts={report.map}
                legend={`${subjectLabel(what)} sequences ${mapTitleOf(where).toLowerCase().replace('sequences per ', 'per ')}`}
            />

            <ReportMetadataSections first={6 + below} metadata={report} dates={report.overTime} />
        </ReportShell>
    );
};

type MutationsSectionProps = {
    state: Loadable<LineageMutations>;
    what: Subject;
    where: Place;
    period: Period;
    comparedWith: Subject | undefined;
};

const MutationsSection: FC<MutationsSectionProps> = ({ state, what, where, period, comparedWith }) => (
    <Section number={3} title='Mutations'>
        <Async state={state} height='h-32'>
            {(data) =>
                data.unavailable !== undefined ? (
                    <Empty>{data.unavailable}</Empty>
                ) : (
                    <div className='flex flex-col gap-3'>
                        <Table
                            columns={[
                                {
                                    header: 'Mutation',
                                    cell: (row) => (
                                        <ReportLink
                                            href={hrefOf({
                                                kind: 'mutations',
                                                what,
                                                where,
                                                query: mutationLabel(row),
                                                period,
                                            })}
                                        >
                                            {mutationLabel(row)}
                                        </ReportLink>
                                    ),
                                },
                                {
                                    header: 'Sequences',
                                    align: 'right',
                                    width: 'w-24',
                                    cell: (row) => formatCount(row.count),
                                },
                                {
                                    header: 'Proportion',
                                    align: 'right',
                                    width: 'w-24',
                                    cell: (row) => formatProportion(row.proportion),
                                },
                                {
                                    header: 'Jaccard index',
                                    align: 'right',
                                    width: 'w-28',
                                    cell: (row) => (row.jaccard === undefined ? '—' : formatIndex(row.jaccard)),
                                },
                            ]}
                            rows={data.common.slice(0, SHOWN_MUTATIONS)}
                            keyOf={(row) => row.key}
                        />
                        <Prose>
                            There are a total of {formatCount(data.totals.nucleotide)} nucleotide{' '}
                            {data.totals.nucleotide === 1 ? 'mutation' : 'mutations'} and{' '}
                            {formatCount(data.totals.aminoAcid)} amino acid{' '}
                            {data.totals.aminoAcid === 1 ? 'mutation' : 'mutations'} present in &gt;50% of the sequences
                            compared to the reference genome. Proportions are calculated by dividing by the number of
                            sequences that have coverage at the respective position.
                        </Prose>
                        {comparedWith !== undefined && (
                            <Prose>
                                The following mutations are in at least {formatProportion(DEFINING)} of{' '}
                                {subjectLabel(what)} and in fewer than {formatProportion(PARENT_MAX)} of the rest of{' '}
                                {subjectLabel(comparedWith)}:{' '}
                                {data.defining.length === 0
                                    ? 'none'
                                    : data.defining.map((row) => mutationLabel(row)).join(', ')}
                                .
                            </Prose>
                        )}
                    </div>
                )
            }
        </Async>
    </Section>
);

function ancestorEntries(what: Subject, hierarchy: Hierarchy, href: (node: PathogenNode) => string): TreeEntry[] {
    return subjectAncestors(what, hierarchy)
        .filter(isPathogenNode)
        .map((node) => ({ label: subjectLabel(node), href: href(node) }));
}

function entryHref(node: PathogenNode, where: Place, period: Period, lineageHref: (node: Subject) => string): string {
    return node.kind === 'subtype' ? lineageHref(node) : hrefOf({ kind: 'virus', what: node, where, period });
}

function levelOf(what: Subject): string | undefined {
    if (!isPathogenNode(what) || what.kind !== 'subtype') {
        return undefined;
    }
    const steps = effectiveSteps(what);
    const last = steps[steps.length - 1];
    return what.pathogen.levels.find((level) => level.column === last.column)?.label;
}
