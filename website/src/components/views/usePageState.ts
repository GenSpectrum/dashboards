import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import type { OrganismConstants } from '../../views/OrganismConstants.ts';
import type { View } from '../../views/View.ts';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler.ts';

export function usePageState<
    V extends View<object, OrganismConstants, PageStateHandler<object>>,
>(view: V) {
    type PageState = V extends View<infer PS, OrganismConstants, PageStateHandler<infer PS>> ? PS : never;

    const [pageState, setPageStateRaw] = useState<PageState>(
        () => view.pageStateHandler.parsePageStateFromUrl(new URL(window.location.href)) as PageState,
    );

    const setPageState: Dispatch<SetStateAction<PageState>> = useCallback(
        (newPageStateOrUpdater) => {
            setPageStateRaw((prevState) => {
                const newPageState =
                    typeof newPageStateOrUpdater === 'function'
                        ? (newPageStateOrUpdater as (prevState: PageState) => PageState)(prevState)
                        : newPageStateOrUpdater;
                window.history.pushState(undefined, '', view.pageStateHandler.toUrl(newPageState));
                return newPageState;
            });
        },
        [view.pageStateHandler],
    );

    return useMemo(() => ({ pageState, setPageState }), [pageState, setPageState]);
}
