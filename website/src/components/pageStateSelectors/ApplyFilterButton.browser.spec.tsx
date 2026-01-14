import { act } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect } from 'vitest';
import { render, renderHook, type RenderResult } from 'vitest-browser-react';

import { ApplyFilterButton } from './ApplyFilterButton';
import { it } from '../../../test-extend';
import type { PageStateHandler } from '../../views/pageStateHandlers/PageStateHandler';

type DummyPageState = {
    data: string;
};

class DummyPageStateHandler implements PageStateHandler<DummyPageState> {
    parsePageStateFromUrl(_url: URL): DummyPageState {
        return { data: '' };
    }

    toUrl(pageState: DummyPageState): string {
        return `/test?data=${pageState.data}`;
    }

    getDefaultPageUrl(): string {
        return '/test';
    }
}

const urlTooLongMessage = /URL is too long/i;

describe('ApplyFilterButton', () => {
    const handler = new DummyPageStateHandler();

    it('should render enabled link for short URL', async () => {
        const shortState: DummyPageState = { data: 'short' };

        const { result: state } = renderHook(() => useState<DummyPageState>({ data: 'initial' }));

        const { getByRole } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} setPageState={state.current[1]} />,
        );

        await clickApply(getByRole);

        expect(state.current[0].data).toEqual('short');
    });

    it('should render disabled span and error message for long URL', async () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { result: state } = renderHook(() => useState<DummyPageState>({ data: 'initial' }));

        const { getByRole, container } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} setPageState={state.current[1]} />,
        );

        expect(container.textContent).toMatch(urlTooLongMessage);
        expect(getByRole('button', { name: 'Apply filters' }).element()).not.toHaveAttribute('onClick');

        await clickApply(getByRole);
        expect(state.current[0].data).toEqual('initial');
    });

    it('should update when state changes from short to long', async () => {
        const shortState: DummyPageState = { data: 'short' };

        const { result: state } = renderHook(() => useState<DummyPageState>({ data: 'initial' }));

        const { getByRole, container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} setPageState={state.current[1]} />,
        );

        await clickApply(getByRole);
        expect(state.current[0].data).toEqual('short');
        expect(container.textContent).not.toMatch(urlTooLongMessage);

        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };
        rerender(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} setPageState={state.current[1]} />,
        );

        expect(container.textContent).toMatch(urlTooLongMessage);
        expect(getByRole('button', { name: 'Apply filters' }).element()).not.toHaveAttribute('onClick');

        await clickApply(getByRole);
        expect(state.current[0].data).toEqual('short');
    });

    it('should update when state changes from long to short', async () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { result: state } = renderHook(() => useState<DummyPageState>({ data: 'initial' }));

        const { getByRole, container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} setPageState={state.current[1]} />,
        );

        expect(getByRole('button', { name: 'Apply filters' }).element()).not.toHaveAttribute('onClick');
        expect(container.textContent).toMatch(urlTooLongMessage);
        await clickApply(getByRole);
        expect(state.current[0].data).toEqual('initial');

        const shortState: DummyPageState = { data: 'short' };
        rerender(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} setPageState={state.current[1]} />,
        );

        expect(container.textContent).not.toMatch(urlTooLongMessage);
        await clickApply(getByRole);
        expect(state.current[0].data).toEqual('short');
    });
});

async function clickApply(getByRole: RenderResult['getByRole']) {
    await act(async () => {
        await getByRole('button', { name: 'Apply filters' }).click();
    });
}
