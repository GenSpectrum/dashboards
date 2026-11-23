import { useEffect, useRef, useState, type FC } from 'react';

import { saveFile } from './saveFile.ts';
import { accessionListFilename, accessionListOf } from '../../../pathoplexusExplorer/accessionList.ts';
import { UNEXPECTED_ERROR } from '../../../pathoplexusExplorer/domain/text.ts';
import { logReadFailure, readRowsWithVersion } from '../../../pathoplexusExplorer/rhydb/hooks/rhydb.ts';
import { RhydbError } from '../../../pathoplexusExplorer/rhydb/transport/query.ts';
import type { Queryable } from '../../../pathoplexusExplorer/rhydb/transport/relation.ts';

type DownloadAccessionsProps = {
    query: Queryable | undefined;
};

export const DownloadAccessions: FC<DownloadAccessionsProps> = ({ query }) => {
    const [state, setState] = useState<'ready' | 'working'>('ready');
    const [error, setError] = useState<string | undefined>(undefined);
    // Cancel a pending accession download when the page is left.
    const pending = useRef<AbortController | undefined>(undefined);
    useEffect(() => () => pending.current?.abort(), []);

    const download = async () => {
        if (query === undefined || state === 'working') {
            return;
        }
        setState('working');
        setError(undefined);
        const controller = new AbortController();
        pending.current = controller;
        try {
            const { rows, dataVersion } = await readRowsWithVersion(query, 'Accession list', controller.signal);
            saveFile(
                accessionListOf(rows),
                accessionListFilename(new Date(), dataVersion),
                'text/tab-separated-values',
            );
        } catch (failure) {
            if (controller.signal.aborted) {
                return;
            }
            logReadFailure(failure);
            setError(failure instanceof RhydbError ? failure.userMessage : UNEXPECTED_ERROR);
        } finally {
            pending.current = undefined;
            setState('ready');
        }
    };

    return (
        <span className='flex items-center gap-2'>
            <button
                type='button'
                className='border border-stone-300 bg-white px-2 py-1 text-[13px] hover:border-stone-500 disabled:text-stone-400'
                disabled={query === undefined || state === 'working'}
                onClick={() => void download()}
            >
                {state === 'working' ? 'Preparing…' : 'Download accession list'}
            </button>
            {error !== undefined && (
                <span role='alert' className='text-[11px] text-red-800'>
                    Failed: {error}
                </span>
            )}
        </span>
    );
};
