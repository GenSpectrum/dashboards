import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

export function usePageState<StateHandler extends PageStateHandler<object>>(pageStateHandler: StateHandler) {
    type PageState = StateHandler extends PageStateHandler<infer PS> ? PS : never;

    const [pageState, setPageStateRaw] = useState<PageState>(
        () => pageStateHandler.parsePageStateFromUrl(new URL(window.location.href)) as PageState,
    );

    const setPageState: Dispatch<SetStateAction<PageState>> = useCallback(
        (newPageStateOrUpdater) => {
            setPageStateRaw((prevState) => {
                const newPageState =
                    typeof newPageStateOrUpdater === 'function'
                        ? newPageStateOrUpdater(prevState)
                        : newPageStateOrUpdater;
                window.history.pushState(undefined, '', pageStateHandler.toUrl(newPageState));
                return newPageState;
            });
        },
        [pageStateHandler],
    );

    return useMemo(() => ({ pageState, setPageState }), [pageState, setPageState]);
}
