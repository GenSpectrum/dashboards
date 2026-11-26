import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { KeyFigures, ReportLink, Section } from './Layout.tsx';
import { mapTitleOf, ReportMap } from './ReportMap.tsx';
import { ReportShell } from './ReportShell.tsx';
import {
    AreasTable,
    Composition,
    Hosts,
    MetadataAvailability,
    OverTime,
    Submitters,
    unplacedNote,
} from './Sections.tsx';
import { areaScale, counted, hasPlacesBelow, plural, rankAreas, spreadFigure, unplacedIn } from './areaScale.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import {
    firstError,
    pathogenBreakdown,
    useReportBasics,
} from '../../../pathoplexusExplorer/dataLayer/hooks/useReports.ts';
import { valueParts } from '../../../pathoplexusExplorer/dataLayer/queries/breakdown.ts';
import { CATALOG } from '../../../pathoplexusExplorer/domain/catalog.ts';
import { placePhrase } from '../../../pathoplexusExplorer/domain/geography.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import { formatCount, formatProportion } from '../../../pathoplexusExplorer/domain/statistics.ts';
import { ALL } from '../../../pathoplexusExplorer/domain/subject.ts';
import { hrefOf } from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { BAR_SCALE } from '../charts/StackedBars.tsx';
import { ErrorMessage } from '../ui/States.tsx';

type LocationReportProps = { reference: ReportRef & { kind: 'location' }; entries: ReportEntries };

export const LocationReport: FC<LocationReportProps> = ({ reference, entries }) => {
    const period = reference.period;
    const where = reference.where;
    const scope = useMemo(() => ({ what: ALL, where, period }), [where, period]);
    const byPathogen = useMemo(() => pathogenBreakdown(CATALOG), []);
    const basics = useReportBasics(scope, CATALOG, byPathogen);
    const error = firstError(basics);
    const summary = basics.summary.data;
    const parts = basics.breakdown.data ?? [];
    const level = basics.spec.data?.title ?? 'Pathogen';
    const total = summary?.n ?? 0;
    const pathogens = valueParts(parts).length;
    const scale = useMemo(() => areaScale(where), [where]);
    const mapRows = basics.map.data?.rows;
    const below = useMemo(() => rankAreas(scale, counted(mapRows ?? [])), [scale, mapRows]);
    const unplaced = useMemo(() => unplacedIn(where, mapRows ?? [], below), [where, mapRows, below]);

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
                        { label: 'Pathogens', value: summary === undefined ? '…' : formatCount(pathogens) },
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
                    parts={parts}
                    total={total}
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
                <OverTime
                    rows={basics.overTime}
                    parts={parts}
                    classify={(row) => basics.spec.data?.classify(row) ?? ''}
                    title={`Sequences by ${level.toLowerCase()}`}
                />
                <OverTime
                    rows={basics.overTime}
                    parts={parts}
                    classify={(row) => basics.spec.data?.classify(row) ?? ''}
                    scale={BAR_SCALE.proportion}
                    title='Composition per period'
                />
            </Section>

            <Section number={4} title='Geographic distribution'>
                <ReportMap where={where} counts={basics.map} legend={mapTitleOf(where)} />
                {hasPlacesBelow(where) && below.length > 0 && (
                    <AreasTable
                        scale={scale}
                        areas={below}
                        period={period}
                        countHeader='Sequences'
                        total={total}
                        footnote={unplacedNote(unplaced, total)}
                    />
                )}
            </Section>

            <Section number={5} title='Hosts'>
                <Hosts rows={basics.hosts} total={total} />
            </Section>

            <Section number={6} title='Metadata availability'>
                <MetadataAvailability availability={basics.availability} dates={basics.overTime} />
            </Section>

            <Section number={7} title='Submitters'>
                <Submitters
                    groups={basics.groups}
                    authors={basics.authors}
                    affiliations={basics.affiliations}
                    total={total}
                />
            </Section>
        </ReportShell>
    );
};
