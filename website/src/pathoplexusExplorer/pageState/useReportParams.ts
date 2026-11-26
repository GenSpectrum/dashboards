import { useCallback, useMemo } from 'react';

import { ReportPageStateHandler } from './handlers/ReportPageStateHandler.ts';
import type { ReportParams } from './reportAddress.ts';
import { usePageState } from '../../components/views/usePageState.ts';
import type { ReportKind, ReportRef } from '../domain/reports.ts';

export type ReportParamsState = {
    params: ReportParams;
    reference: ReportRef | undefined;
    update: (change: Partial<ReportParams>, options?: { replace?: boolean }) => void;
    switchTo: (kind: ReportKind) => void;
};

export function useReportParams(kind: ReportKind): ReportParamsState {
    // Keep one handler per report kind so its identity stays stable across renders.
    const handler = useMemo(() => new ReportPageStateHandler(kind), [kind]);
    const { pageState, setPageState } = usePageState(handler);

    const update = useCallback(
        (change: Partial<ReportParams>, options?: { replace?: boolean }) => {
            setPageState((previous) => ({ ...previous, ...change }), options);
        },
        [setPageState],
    );

    const switchTo = useCallback(
        (next: ReportKind) => {
            window.location.href = handler.urlForKind(next, pageState);
        },
        [handler, pageState],
    );

    const reference = useMemo(() => handler.referenceOf(pageState), [handler, pageState]);

    return useMemo(
        () => ({ params: pageState, reference, update, switchTo }),
        [pageState, reference, update, switchTo],
    );
}
