import { type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

/**
 * Keeps page state in sync with the URL. Updates add a history entry by default.
 * Pass `{ replace: true }` to update the current history entry.
 */
export function usePageState<StateHandler extends PageStateHandler<object>>(pageStateHandler: StateHandler) {
    type PageState = StateHandler extends PageStateHandler<infer PS> ? PS : never;

    const [pageState, setPageStateRaw] = useState<PageState>(
        () => pageStateHandler.parsePageStateFromUrl(new URL(window.location.href)) as PageState,
    );
    // The latest state, including updates that React has not rendered yet, so that each update writes history once.
    const latest = useRef(pageState);

    const setPageState = useCallback(
        (newPageStateOrUpdater: SetStateAction<PageState>, options?: { replace?: boolean }) => {
            const newPageState =
                typeof newPageStateOrUpdater === 'function'
                    ? newPageStateOrUpdater(latest.current)
                    : newPageStateOrUpdater;
            latest.current = newPageState;
            const url = pageStateHandler.toUrl(newPageState);
            if (options?.replace) {
                window.history.replaceState(undefined, '', url);
            } else {
                window.history.pushState(undefined, '', url);
            }
            setPageStateRaw(newPageState);
        },
        [pageStateHandler],
    );

    useEffect(() => {
        const handlePopState = () => {
            const url = new URL(window.location.href);
            const newPageState = pageStateHandler.parsePageStateFromUrl(url) as PageState;
            latest.current = newPageState;
            setPageStateRaw(newPageState);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [pageStateHandler]);

    return useMemo(() => ({ pageState, setPageState }), [pageState, setPageState]);
}
