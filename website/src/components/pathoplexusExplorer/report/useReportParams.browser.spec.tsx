import { describe, expect } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useReportParams } from './useReportParams.ts';
import { it } from '../../../../test-extend';

describe('useReportParams', () => {
    it('takes the report from the address, and writes a change back to it', async () => {
        window.history.replaceState({}, '', '/pathoplexus-explorer/reports/virus?what=pathogen%3Ampox');

        const { result, act } = await renderHook(() => useReportParams('virus'));

        expect(result.current.reference?.kind).toBe('virus');
        expect(result.current.params.where).toEqual({ level: 'world' });

        await act(() => {
            result.current.update({ where: { level: 'country', country: 'Uganda' } });
        });

        expect(result.current.params.where).toEqual({ level: 'country', country: 'Uganda' });
        expect(window.location.search).toContain('where=country%3AUganda');
    });

    it('names no report while the address does not name one', async () => {
        window.history.replaceState({}, '', '/pathoplexus-explorer/reports/lineage');

        const { result } = await renderHook(() => useReportParams('lineage'));

        expect(result.current.reference).toBeUndefined();
    });

    it('follows the browser back to the report the address named before', async () => {
        window.history.replaceState({}, '', '/pathoplexus-explorer/reports/virus?what=pathogen%3Ampox');
        const { result, act } = await renderHook(() => useReportParams('virus'));

        await act(() => {
            result.current.update({ period: { from: '2024-01-01', to: undefined } });
        });
        await act(() => {
            window.history.replaceState({}, '', '/pathoplexus-explorer/reports/virus?what=pathogen%3Ampox');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        expect(result.current.params.period.from).toBeUndefined();
    });

    it('replaces the address where the page completes it rather than the reader', async () => {
        window.history.replaceState({}, '', '/pathoplexus-explorer/reports/virus?what=pathogen%3Ampox');
        const { result, act } = await renderHook(() => useReportParams('virus'));
        const before = window.history.length;

        await act(() => {
            result.current.update({ period: { from: '2024-01-01', to: undefined } }, { replace: true });
        });

        expect(window.location.search).toContain('when=2024-01-01%2F..');
        expect(window.history.length).toBe(before);
    });
});
