import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ApplyFilterButton } from './ApplyFilterButton';
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

describe('ApplyFilterButton', () => {
    const handler = new DummyPageStateHandler();

    test('should render enabled link for short URL', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { container } = render(<ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />);

        const link = container.querySelector('a');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/test?data=short');
        expect(container.querySelector('span.btn-disabled')).not.toBeInTheDocument();
        expect(container.textContent).not.toMatch(/URL is too long/i);
    });

    test('should render disabled span and error message for long URL', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { container } = render(<ApplyFilterButton pageStateHandler={handler} newPageState={longState} />);

        const disabledSpan = container.querySelector('span.btn-disabled');
        expect(disabledSpan).toBeInTheDocument();
        expect(container.querySelector('a')).not.toBeInTheDocument();
        expect(container.textContent).toMatch(/URL is too long/i);
        expect(container.textContent).toMatch(/2000/);
    });

    test('should update when state changes from short to long', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />,
        );

        expect(container.querySelector('a')).toBeInTheDocument();
        expect(container.querySelector('span.btn-disabled')).not.toBeInTheDocument();

        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={longState} />);

        expect(container.querySelector('span.btn-disabled')).toBeInTheDocument();
        expect(container.querySelector('a')).not.toBeInTheDocument();
        expect(container.textContent).toMatch(/URL is too long/i);
    });

    test('should update when state changes from long to short', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} />,
        );

        expect(container.querySelector('span.btn-disabled')).toBeInTheDocument();
        expect(container.querySelector('a')).not.toBeInTheDocument();

        const shortState: DummyPageState = { data: 'short' };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />);

        expect(container.querySelector('a')).toBeInTheDocument();
        expect(container.querySelector('span.btn-disabled')).not.toBeInTheDocument();
        expect(container.textContent).not.toMatch(/URL is too long/i);
    });
});
