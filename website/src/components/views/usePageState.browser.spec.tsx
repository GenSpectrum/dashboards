import { StrictMode } from 'react';
import { afterEach, describe, expect, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { usePageState } from './usePageState';
import { it } from '../../../test-extend';

describe('usePageState', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should update pageState when URL changes via browser navigation', async () => {
        window.history.pushState({}, '', '/?value=initial');

        const mockPageStateHandler = {
            parsePageStateFromUrl(url: URL) {
                return { value: url.searchParams.get('value') };
            },
            toUrl(pageState: { value: string | null }) {
                return `/?value=${pageState.value ?? ''}`;
            },
            getDefaultPageUrl() {
                return '/?value=initial';
            },
        };

        const { result, act } = await renderHook(() => usePageState(mockPageStateHandler));

        expect(result.current.pageState.value).equals('initial');

        await act(() => {
            window.history.pushState({}, '', '/?value=updated');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        expect(result.current.pageState.value).toBe('updated');
    });

    it('writes one history entry per update, and composes updates made before a render', async () => {
        window.history.pushState({}, '', '/?value=0');
        const handler = {
            parsePageStateFromUrl(url: URL) {
                return { value: Number(url.searchParams.get('value') ?? 0) };
            },
            toUrl(pageState: { value: number }) {
                return `/?value=${pageState.value}`;
            },
            getDefaultPageUrl() {
                return '/?value=0';
            },
        };
        const pushState = vi.spyOn(window.history, 'pushState');
        const replaceState = vi.spyOn(window.history, 'replaceState');

        const { result, act } = await renderHook(() => usePageState(handler), { wrapper: StrictMode });
        await act(() => {
            result.current.setPageState((previous) => ({ value: previous.value + 1 }));
            result.current.setPageState((previous) => ({ value: previous.value + 1 }), { replace: true });
        });

        expect(result.current.pageState.value).toBe(2);
        expect(window.location.search).toBe('?value=2');
        expect(pushState).toHaveBeenCalledTimes(1);
        expect(replaceState).toHaveBeenCalledTimes(1);
    });
});
