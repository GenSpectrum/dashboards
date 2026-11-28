import type { FC, ReactNode } from 'react';

import { Masthead, SourceNote } from './Layout.tsx';
import { formatLongDate, todayUtc } from '../../../pathoplexusExplorer/domain/dates.ts';
import type { ReportRef } from '../../../pathoplexusExplorer/domain/reports.ts';
import { capitalized } from '../../../pathoplexusExplorer/domain/text.ts';
import {
    hrefOf,
    impossibleScope,
    KIND_LABELS,
    scopeLine,
    titleOf,
} from '../../../pathoplexusExplorer/pageState/reportKinds.ts';

type ReportShellProps = { reference: ReportRef; children: ReactNode };

/** Use the A4 page width on screen to match the printed layout. */
export const ReportShell: FC<ReportShellProps> = ({ reference, children }) => {
    const today = todayUtc();
    const impossible = impossibleScope(reference);
    return (
        <article className='sheet mx-auto flex flex-col gap-6 border border-stone-300 bg-white p-6 shadow-sm sm:p-10'>
            <Masthead
                title={titleOf(reference)}
                kind={`GenSpectrum ${KIND_LABELS[reference.kind]}`}
                scope={capitalized(scopeLine(reference, today))}
                written={formatLongDate(today)}
            >
                {impossible !== undefined && (
                    <p role='alert' className='report-note font-semibold text-red-800'>
                        {impossible}
                    </p>
                )}
            </Masthead>

            {impossible === undefined && children}

            <SourceNote href={`${window.location.origin}${hrefOf(reference)}`} />
        </article>
    );
};
