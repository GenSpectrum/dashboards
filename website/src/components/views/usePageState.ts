import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

/**
 * Given a `PageStateHandler`, this hook initially parses the page state from the current URL.
 * It returns a `pageState` object and a `setPageState` function.
 * When the function is called,
 * the new page state is turned into a URL and set as the current URL (added to the page history).
 * This way, the URL and current page state are kept in sync.
 */
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
