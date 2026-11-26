import { type FC, useMemo } from 'react';

import { Citation } from './Citation.tsx';
import { KeyFigures, ReportLink, Section } from './Layout.tsx';
import { classificationRows, LineageTree } from './LineageTree.tsx';
import { nomenclatureNote } from './Nomenclature.tsx';
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
import {
    areaScale,
    counted,
    hasPlacesBelow,
    plural,
    rankAreas,
    spreadFigure,
    spreadPhrase,
    unplacedIn,
} from './areaScale.ts';
import type { ReportEntries } from '../../../pathoplexusExplorer/dataLayer/hooks/useEntries.ts';
import { firstError, useReportBasics } from '../../../pathoplexusExplorer/dataLayer/hooks/useReports.ts';
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
import { BAR_SCALE } from '../charts/StackedBars.tsx';
import { ErrorMessage } from '../ui/States.tsx';

type VirusReportProps = { reference: ReportRef & { kind: 'virus' | 'lineage' }; entries: ReportEntries };

export const VirusReport: FC<VirusReportProps> = ({ reference, entries }) => {
    const period = reference.period;
    const where = reference.where;
    const scope = useMemo(() => ({ what: reference.what, where, period }), [reference.what, where, period]);
    const basics = useReportBasics(scope, CATALOG);
    const error = firstError(basics);
    const summary = basics.summary.data;
    const grouped = basics.breakdown.data;
    const parts = useMemo(() => grouped ?? [], [grouped]);
    const total = summary?.n ?? 0;
    const spec = basics.spec.data;
    const level = spec?.title ?? 'Subtype';
    const href = useMemo(() => (node: Subject) => partHref({ what: node }, where, period), [where, period]);
    const rows = useMemo(
        () =>
            classificationRows({
                subject: { label: subjectTitle(reference.what) },
                spec,
                parts,
                total,
                href,
                what: level.toLowerCase(),
            }),
        [reference.what, spec, parts, total, href, level],
    );
    const scale = useMemo(() => areaScale(where), [where]);
    const mapRows = basics.map.data?.rows;
    const areas = useMemo(() => rankAreas(scale, counted(mapRows ?? [])), [scale, mapRows]);
    const unplaced = useMemo(() => unplacedIn(where, mapRows ?? [], areas), [where, mapRows, areas]);

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
                                      value: summary === undefined ? '…' : formatCount(valueParts(parts).length),
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
                    <LineageTree rows={rows} total={total} title={level} />
                ) : (
                    <Composition
                        parts={parts}
                        total={total}
                        what={level.toLowerCase()}
                        linkOf={(part) => (
                            <ReportLink href={partHref(part.target, where, period)}>{part.label}</ReportLink>
                        )}
                    />
                )}
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
                <ReportMap
                    where={where}
                    counts={basics.map}
                    legend={`${subjectPhrase(reference.what)}: ${mapTitleOf(where).toLowerCase()}`}
                />
                {hasPlacesBelow(where) && areas.length > 0 && (
                    <AreasTable
                        scale={scale}
                        areas={areas}
                        period={period}
                        countHeader='Sequences'
                        total={total}
                        footnote={unplacedNote(unplaced, total)}
                        linkTo={(place) => hrefOf({ kind: 'virus', what: reference.what, where: place, period })}
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
