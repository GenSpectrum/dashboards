import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { Composition } from './Composition.tsx';
import { DistributionOverTime } from './DistributionOverTime.tsx';
import { GeographicDistribution } from './GeographicDistribution.tsx';
import { KeyFigures, ReportLink, Section } from './Layout.tsx';
import { mapTitleOf } from './ReportMap.tsx';
import { ReportMetadataSections } from './ReportMetadataSections.tsx';
import { ReportShell } from './ReportShell.tsx';
import { plural, spreadFigure } from './areaScale.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import { firstError, useReportData } from '../../../pathoplexusExplorer/dataLayer/hooks/useReportData.ts';
import { pathogenBreakdown, valueParts } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { placePhrase } from '../../../pathoplexusExplorer/domain/geography.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { ALL } from '../../../pathoplexusExplorer/domain/subject.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { ErrorMessage } from '../ui/States.tsx';

type LocationReportProps = { reference: ReportRef & { kind: 'location' }; entries: ReportEntries };

const BY_PATHOGEN = pathogenBreakdown(CATALOG);

export const LocationReport: FC<LocationReportProps> = ({ reference, entries }) => {
    const { period, where } = reference;
    const scope = useMemo(() => ({ what: ALL, where, period }), [where, period]);
    const report = useReportData(scope, CATALOG, BY_PATHOGEN);
    const error = firstError(report);
    const summary = report.summary.data;
    const grouped = report.breakdown.data;
    const parts = grouped ?? [];
    const level = report.spec.data?.title ?? 'Pathogen';
    const total = summary?.n ?? 0;
    const pathogens = valueParts(parts).length;
    const mapRows = report.map.data?.rows;

    return (
        <ReportShell reference={reference}>
            {error !== null && <ErrorMessage error={error} />}

            <Section
                number={1}
                title='Dataset'
                lead={
                    summary === undefined || report.breakdown.data === undefined ? (
                        'Counting the sequences…'
                    ) : (
                        <>
                            <strong>Pathoplexus</strong> holds <strong>{formatCount(total)}</strong> sequences whose
                            samples were collected {placePhrase(where)}
                            {period.from !== undefined || period.to !== undefined ? ' in this period' : ''}, of{' '}
                            {formatCount(pathogens)} {pathogens === 1 ? 'pathogen' : 'pathogens'}, submitted by{' '}
                            {formatCount(summary.groups)}{' '}
                            {summary.groups === 1 ? 'submitting group' : 'submitting groups'}.
                            {parts.length > 0 && total > 0 && (
                                <>
                                    {' '}
                                    {parts[0].label} accounts for {formatProportion(parts[0].n / total)} of them
                                    {parts.length > 1 &&
                                        `, ${parts[1].label} for ${formatProportion(parts[1].n / total)}`}
                                    .
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
                        {
                            label: 'Pathogens',
                            value: report.breakdown.data === undefined ? '…' : formatCount(pathogens),
                        },
                        spreadFigure(where, mapRows, summary?.countries),
                        {
                            label: 'Submitting groups',
                            value: summary === undefined ? '…' : formatCount(summary.groups),
                        },
                    ]}
                />
            </Section>

            <Section number={2} title={plural(level)}>
                <Composition
                    parts={grouped}
                    total={summary?.n}
                    what='pathogen'
                    linkOf={(part) => (
                        <ReportLink
                            href={
                                part.target?.what === undefined
                                    ? undefined
                                    : hrefOf({ kind: 'virus', what: part.target.what, where, period })
                            }
                        >
                            {part.label}
                        </ReportLink>
                    )}
                />
            </Section>

            <Section number={3} title='Distribution over time'>
                <DistributionOverTime report={report} title={`Sequences by ${level.toLowerCase()}`} showComposition />
            </Section>

            <GeographicDistribution number={4} reference={reference} counts={report.map} legend={mapTitleOf(where)} />

            <ReportMetadataSections first={5} metadata={report} dates={report.overTime} />
        </ReportShell>
    );
};
