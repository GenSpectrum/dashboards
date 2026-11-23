import type { FC } from 'react';

import { KindIcon } from './KindIcon.tsx';
import {
    KIND_DESCRIPTIONS,
    KIND_LABELS,
    KIND_PATHS,
    REPORT_KINDS,
} from '../../../pathoplexusExplorer/reports/kinds.ts';

export const ReportsLandingPage: FC = () => {
    return (
        <div className='sheet mx-auto flex flex-col gap-4 p-4'>
            <header className='flex flex-col gap-2 border-b-2 border-stone-800 bg-white p-6 pb-4'>
                <h1 className='text-3xl font-bold'>Reports</h1>
                <p className='text-sm leading-relaxed text-stone-700'>
                    Select the type of report of your interest. The reports are computed from latest-version and
                    non-revoked data on Pathoplexus. You can save a report as a PDF, or print it, with the Print button
                    at the top of the report.
                </p>
            </header>

            <ul className='grid gap-3 sm:grid-cols-2'>
                {REPORT_KINDS.map((kind) => (
                    <li key={kind} className='flex min-w-0 border border-stone-300 bg-white'>
                        <a
                            href={KIND_PATHS[kind]}
                            className='group flex flex-1 items-center gap-4 p-5 hover:bg-stone-50'
                        >
                            <KindIcon kind={kind} />
                            <span className='flex min-w-0 flex-col gap-1'>
                                <span className='text-lg font-bold text-stone-800 group-hover:underline'>
                                    {KIND_LABELS[kind]}
                                </span>
                                <span className='text-sm leading-snug text-stone-700'>{KIND_DESCRIPTIONS[kind]}</span>
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};
