import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { Composition } from './Composition.tsx';
import { DistributionOverTime } from './DistributionOverTime.tsx';
import { GeographicDistribution } from './GeographicDistribution.tsx';
import { KeyFigures, ReportLink, Section } from './Layout.tsx';
import { classificationRows, LineageTree } from './LineageTree.tsx';
import { nomenclatureNote } from './Nomenclature.tsx';
import { mapTitleOf } from './ReportMap.tsx';
import { ReportMetadataSections } from './ReportMetadataSections.tsx';
import { ReportShell } from './ReportShell.tsx';
import { plural, spreadFigure, spreadPhrase } from './areaScale.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import { firstError, useReportData } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { valueParts, type SeriesTarget } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import type { Place } from '../../../pathoplexusExplorer/domain/geography.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import type { Period } from '../../../pathoplexusExplorer/domain/scope.ts';
import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import {
    isMenuSubtype,
    subjectPhrase,
    subjectTitle,
    type Subject,
} from '../../../pathoplexusExplorer/domain/subject.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { ErrorMessage } from '../ui/States.tsx';

type VirusReportProps = { reference: ReportRef & { kind: 'virus' }; entries: ReportEntries };

export const VirusReport: FC<VirusReportProps> = ({ reference, entries }) => {
    const { period, where } = reference;
    const scope = useMemo(() => ({ what: reference.what, where, period }), [reference.what, where, period]);
    const report = useReportData(scope, CATALOG);
    const error = firstError(report);
    const summary = report.summary.data;
    const grouped = report.breakdown.data;
    const parts = useMemo(() => grouped ?? [], [grouped]);
    const total = summary?.n ?? 0;
    const spec = report.spec.data;
    const level = spec?.title ?? 'Subtype';
    const href = useMemo(() => (node: Subject) => partHref({ what: node }, where, period), [where, period]);
    const rows = useMemo(
        () =>
            classificationRows({
                subject: { label: subjectTitle(reference.what) },
                spec,
                parts,
                total: summary?.n,
                href,
                what: level.toLowerCase(),
            }),
        [reference.what, spec, parts, summary?.n, href, level],
    );
    const mapRows = report.map.data?.rows;

    return (
        <ReportShell reference={reference}>
            {error !== null && <ErrorMessage error={error} />}

            <Section
                number={1}
                title='Dataset'
                lead={
                    summary === undefined ? (
                        'Counting the sequences…'
                    ) : (
                        <>
                            <strong>Pathoplexus</strong> holds <strong>{formatCount(total)}</strong>{' '}
                            {heldPhrase(reference.what)} {spreadPhrase(where, mapRows, summary.countries)}, submitted by{' '}
                            {formatCount(summary.groups)} submitting {summary.groups === 1 ? 'group' : 'groups'}.
                            {parts.length > 0 && total > 0 && (
                                <>
                                    {' '}
                                    The most common {level.toLowerCase()} is {parts[0].label}, at{' '}
                                    {formatProportion(parts[0].n / total)}.
                                </>
                            )}
                            <Citation reference={reference} entries={entries} />
                        </>
                    )
                }
            >
                <KeyFigures
                    figures={[
                        { label: 'Sequences', value: summary === undefined ? '…' : formatCount(total) },
                        spreadFigure(where, mapRows, summary?.countries),
                        // A breakdown shows one classification level, so its row count is not a count of all lineages.
                        ...(spec === undefined || spec.of === 'classification'
                            ? []
                            : [
                                  {
                                      label: plural(level),
                                      value: grouped === undefined ? '…' : formatCount(valueParts(parts).length),
                                  },
                              ]),
                    ]}
                />
            </Section>

            <Section
                number={2}
                title={plural(level)}
                lead={spec?.of === 'classification' ? nomenclatureNote(reference.what) : undefined}
            >
                {spec?.of === 'classification' ? (
                    <LineageTree rows={grouped === undefined ? undefined : rows} total={summary?.n} title={level} />
                ) : (
                    <Composition
                        parts={grouped}
                        total={summary?.n}
                        what={level.toLowerCase()}
                        linkOf={(part) => (
                            <ReportLink href={partHref(part.target, where, period)}>{part.label}</ReportLink>
                        )}
                    />
                )}
            </Section>

            <Section number={3} title='Distribution over time'>
                <DistributionOverTime report={report} title={`Sequences by ${level.toLowerCase()}`} showComposition />
            </Section>

            <GeographicDistribution
                number={4}
                reference={reference}
                counts={report.map}
                legend={`${subjectPhrase(reference.what)}: ${mapTitleOf(where).toLowerCase()}`}
            />

            <ReportMetadataSections first={5} metadata={report} dates={report.overTime} />
        </ReportShell>
    );
};

function heldPhrase(what: Subject): string {
    return what.kind === 'group'
        ? `sequences of the ${what.group.label.toLowerCase()} pathogens`
        : `${subjectTitle(what)} sequences`;
}

function partHref(target: SeriesTarget | undefined, where: Place, period: Period): string | undefined {
    const what = target?.what;
    if (what?.kind === 'subtype') {
        const kind = isMenuSubtype(what) ? 'virus' : 'lineage';
        return hrefOf({ kind, what, where, period });
    }
    if (what?.kind === 'pathogen' || what?.kind === 'family' || what?.kind === 'group') {
        return hrefOf({ kind: 'virus', what, where, period });
    }
    return undefined;
}
