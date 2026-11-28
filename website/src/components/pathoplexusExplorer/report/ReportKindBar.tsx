import type { FC } from 'react';

import type { Queryable } from '../../../pathoplexusExplorer/dataLayer/transport/relation.ts';
import { REPORT_KINDS, type ReportKind } from '../../../pathoplexusExplorer/domain/reports.ts';
import {
    KIND_DESCRIPTIONS,
    KIND_LABELS,
    REPORTS_BASE_PATH,
} from '../../../pathoplexusExplorer/pageState/reportKinds.ts';
import { DownloadAccessions } from '../ui/DownloadAccessions.tsx';
import { Popover } from '../ui/Picker.tsx';

type ReportKindBarProps = {
    kind: ReportKind;
    onSwitch: (kind: ReportKind) => void;
    accessions?: Queryable;
};

export const ReportKindBar: FC<ReportKindBarProps> = ({ kind, onSwitch, accessions }) => {
    return (
        <div className='no-print border-b border-stone-200 bg-white'>
            <div className='sheet mx-auto flex items-center justify-between gap-3 px-4 py-1.5'>
                <Popover label='Report' value={KIND_LABELS[kind]} placeholder='Choose a report' width='w-80'>
                    {(close) => (
                        <ul className='flex flex-col'>
                            {REPORT_KINDS.map((candidate) => (
                                <li key={candidate} className='border-b border-stone-100 last:border-b-0'>
                                    <button
                                        type='button'
                                        aria-current={candidate === kind ? 'page' : undefined}
                                        className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-stone-50 ${
                                            candidate === kind ? 'bg-stone-50' : ''
                                        }`}
                                        onClick={() => {
                                            onSwitch(candidate);
                                            close();
                                        }}
                                    >
                                        <span
                                            className={`text-sm ${candidate === kind ? 'font-bold' : 'text-primary font-semibold'}`}
                                        >
                                            {KIND_LABELS[candidate]}
                                        </span>
                                        <span className='report-note leading-snug text-stone-600'>
                                            {KIND_DESCRIPTIONS[candidate]}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Popover>
                <div className='report-small flex items-center gap-3'>
                    <a href={REPORTS_BASE_PATH} className='text-primary underline underline-offset-2'>
                        all reports
                    </a>
                    <DownloadAccessions query={accessions} />
                    <button
                        type='button'
                        className='border border-stone-800 bg-white px-2.5 py-1 font-semibold text-stone-800 hover:bg-stone-800 hover:text-white'
                        onClick={() => window.print()}
                    >
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
};
