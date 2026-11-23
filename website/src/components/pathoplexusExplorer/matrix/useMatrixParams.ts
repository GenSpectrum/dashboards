import { useCallback, useMemo } from 'react';

import { withChange, type MatrixParams } from '../../../pathoplexusExplorer/matrix/address.ts';
import { MatrixPageStateHandler } from '../../../pathoplexusExplorer/matrix/matrixPageState.ts';
import { usePageState } from '../../views/usePageState.ts';

export type MatrixParamsState = {
    params: MatrixParams;
    update: (change: Partial<MatrixParams>, options?: { replace?: boolean }) => void;
    canonicalSearch: string;
};

export function useMatrixParams(): MatrixParamsState {
    const handler = useMemo(() => new MatrixPageStateHandler(), []);
    const { pageState, setPageState } = usePageState(handler);

    const update = useCallback(
        (change: Partial<MatrixParams>, options?: { replace?: boolean }) => {
            setPageState((previous) => withChange(previous, change), options);
        },
        [setPageState],
    );

    return useMemo(
        () => ({ params: pageState, update, canonicalSearch: handler.canonicalSearch(pageState) }),
        [handler, pageState, update],
    );
}
