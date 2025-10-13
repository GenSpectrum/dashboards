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

    test('should render enabled button for short URL', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { container } = render(<ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />);

        const button = container.querySelector('button');
        expect(button).not.toBeDisabled();
        expect(container.textContent).not.toMatch(/URL is too long/i);
    });

    test('should render disabled button and error message for long URL', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { container } = render(<ApplyFilterButton pageStateHandler={handler} newPageState={longState} />);

        const button = container.querySelector('button');
        expect(button).toBeDisabled();
        expect(container.textContent).toMatch(/URL is too long/i);
        expect(container.textContent).toMatch(/2000/);
    });

    test('should update when state changes from short to long', () => {
        const shortState: DummyPageState = { data: 'short' };

        const { container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />,
        );

        const button = container.querySelector('button');
        expect(button).not.toBeDisabled();

        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={longState} />);

        expect(button).toBeDisabled();
        expect(container.textContent).toMatch(/URL is too long/i);
    });

    test('should update when state changes from long to short', () => {
        const longData = 'x'.repeat(2000);
        const longState: DummyPageState = { data: longData };

        const { container, rerender } = render(
            <ApplyFilterButton pageStateHandler={handler} newPageState={longState} />,
        );

        const button = container.querySelector('button');
        expect(button).toBeDisabled();

        const shortState: DummyPageState = { data: 'short' };
        rerender(<ApplyFilterButton pageStateHandler={handler} newPageState={shortState} />);

        expect(button).not.toBeDisabled();
        expect(container.textContent).not.toMatch(/URL is too long/i);
    });
});
