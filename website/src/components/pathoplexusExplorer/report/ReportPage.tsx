import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type FC } from 'react';

import { LineageReport } from './LineageReport.tsx';
import { LocationReport } from './LocationReport.tsx';
import { MutationReport } from './MutationReport.tsx';
import { ReportBar } from './ReportBar.tsx';
import { ReportKindBar } from './ReportKindBar.tsx';
import { ReportShell } from './ReportShell.tsx';
import { VirusReport } from './VirusReport.tsx';
import { useReportParams } from './useReportParams.ts';
import { isPathogenNode } from '../../../pathoplexusExplorer/domain/subject.ts';
import {
    KIND_DESCRIPTIONS,
    impossibleScope,
    KIND_LABELS,
    REPORT_KIND,
    reportPageTitle,
    searchOf,
    type ReportKind,
    type ReportRef,
} from '../../../pathoplexusExplorer/reports/kinds.ts';
import { useReportEntries, type ReportEntries } from '../../../pathoplexusExplorer/reports/useEntries.ts';
import { useMutationCheck, type MutationCheck } from '../../../pathoplexusExplorer/reports/useMutation.ts';
import { initRhydb, rhydbQueryClient } from '../../../pathoplexusExplorer/rhydb/hooks/rhydb.ts';

type ReportPageProps = {
    kind: ReportKind;
    rhydbUrl: string;
};

export const ReportPage: FC<ReportPageProps> = ({ kind, rhydbUrl }) => {
    initRhydb(rhydbUrl);
    return (
        <QueryClientProvider client={rhydbQueryClient}>
            <Report kind={kind} />
        </QueryClientProvider>
    );
};

type ReportProps = { kind: ReportKind };

const Report: FC<ReportProps> = ({ kind }) => {
    const { params, reference, update, switchTo } = useReportParams(kind);
    // A report counts nothing for a scope that no sequence can match, or for a mutation query that does not resolve.
    const usable = reference === undefined || impossibleScope(reference) !== undefined ? undefined : reference;
    const mutations = usable?.kind === REPORT_KIND.mutations ? usable : undefined;
    const check = useMutationCheck(mutations?.what, mutations?.query ?? '');
    const entries = useReportEntries(mutations === undefined || check.valid === true ? usable : undefined);

    useEffect(() => {
        document.title = reportPageTitle(kind, reference);
    }, [kind, reference]);

    /** Canonicalize the report URL without adding browser history. */
    useEffect(() => {
        const canonical = searchOf(params).toString();
        if (window.location.search.replace(/^\?/, '') !== canonical) {
            update({}, { replace: true });
        }
    }, [params, update]);

    return (
        <div className='flex flex-col'>
            <ReportKindBar kind={kind} onSwitch={switchTo} accessions={entries.list} />
            <ReportBar kind={kind} params={params} onChange={update} />
            <div className='w-full p-4 print:p-0'>
                {reference === undefined ? (
                    <Waiting
                        kind={kind}
                        hasPathogen={
                            kind === REPORT_KIND.virus ? params.what !== undefined : isPathogenNode(params.what)
                        }
                    />
                ) : usable === undefined ? (
                    <ReportShell reference={reference}>{null}</ReportShell>
                ) : (
                    reportOf(usable, entries, check)
                )}
            </div>
        </div>
    );
};

function reportOf(reference: ReportRef, entries: ReportEntries, check: MutationCheck) {
    switch (reference.kind) {
        case REPORT_KIND.location:
            return <LocationReport reference={reference} entries={entries} />;
        case REPORT_KIND.virus:
            return <VirusReport reference={reference} entries={entries} />;
        case REPORT_KIND.lineage:
            return <LineageReport reference={reference} entries={entries} />;
        case REPORT_KIND.mutations:
            return <MutationReport reference={reference} entries={entries} check={check} />;
    }
}

type WaitingProps = { kind: ReportKind; hasPathogen: boolean };

const Waiting: FC<WaitingProps> = ({ kind, hasPathogen }) => {
    const asking =
        kind === REPORT_KIND.lineage && hasPathogen
            ? 'Choose a lineage or clade in the bar above.'
            : kind === REPORT_KIND.mutations && hasPathogen
              ? 'Type a mutation in the bar above.'
              : 'Choose a pathogen in the bar above.';
    return (
        <div className='sheet mx-auto flex flex-col gap-2 border border-dashed border-stone-300 bg-white p-8'>
            <h1 className='text-xl font-bold'>{KIND_LABELS[kind]}</h1>
            <p className='text-sm text-stone-700'>{KIND_DESCRIPTIONS[kind]}</p>
            <p className='text-primary text-sm font-semibold'>{asking}</p>
        </div>
    );
};
