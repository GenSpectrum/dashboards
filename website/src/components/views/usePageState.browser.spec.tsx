import { act } from '@testing-library/react';
import { describe, expect } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { usePageState } from './usePageState';
import { it } from '../../../test-extend';

describe('usePageState', () => {
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

        const { result } = renderHook(() => usePageState(mockPageStateHandler));

        expect(result.current.pageState.value).equals('initial');

        act(() => {
            window.history.pushState({}, '', '/?value=updated');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        expect(result.current.pageState.value).toBe('updated');
    });
});
