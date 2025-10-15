import React from 'react';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

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

    it('should render enabled link for short URL', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { getByRole, container } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />,
        );

        const link = getByRole('button');
        expect(link.element()).toBeInTheDocument();
        expect(link.element()).toHaveAttribute('href', '/test?data=short');
        expect(container.textContent).not.toMatch(urlTooLongMessage);
    });

    it('should render disabled span and error message for long URL', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { getByRole, container } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} />,
        );

        const button = getByRole('button');
        expect(button.element()).not.toHaveAttribute('href');
        expect(container.textContent).toMatch(urlTooLongMessage);
    });

    it('should update when state changes from short to long', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { getByRole, container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />,
        );

        const button = getByRole('button');
        expect(button.element()).toHaveAttribute('href', '/test?data=short');
        expect(container.textContent).not.toMatch(urlTooLongMessage);

        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={longState} />);

        const updatedButton = getByRole('button');
        expect(updatedButton.element()).not.toHaveAttribute('href');
        expect(container.textContent).toMatch(urlTooLongMessage);
    });

    it('should update when state changes from long to short', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { getByRole, container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} />,
        );

        const button = getByRole('button');
        expect(button.element()).not.toHaveAttribute('href');
        expect(container.textContent).toMatch(urlTooLongMessage);

        const shortState: DummyPageState = { data: 'short' };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />);

        const updatedButton = getByRole('button');
        expect(updatedButton.element()).toHaveAttribute('href', '/test?data=short');
        expect(container.textContent).not.toMatch(urlTooLongMessage);
    });
});
