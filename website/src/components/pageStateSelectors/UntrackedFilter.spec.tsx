import { type UseQueryResult } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { UntrackedFilter } from './WasapPageStateSelector';
import type { WasapUntrackedFilter } from '../../views/pageStateHandlers/WasapPageStateHandler';

describe('UntrackedFilter - custom variants textarea', () => {
    const mockCladeLineageQueryResult = {
        isPending: false,
        isError: false,
        data: {},
    } as UseQueryResult<Record<string, string>>;

    const defaultPageState: WasapUntrackedFilter = {
        mode: 'untracked',
        sequenceType: 'nucleotide',
        excludeSet: 'custom',
        excludeVariants: [],
    };

    afterEach(() => cleanup());

    test('allows typing spaces without them disappearing', async () => {
        const user = userEvent.setup();
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await user.type(textarea, 'JN.1 ');

        // The textarea should still show the trailing space
        expect(textarea).toHaveValue('JN.1 ');
    });

    test('parses space-separated variants', async () => {
        const user = userEvent.setup();
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await user.type(textarea, 'JN.1 KP.2');

        // Should have been called with parsed variants
        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2'],
            }),
        );
    });

    test('parses comma-separated variants', async () => {
        const user = userEvent.setup();
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await user.type(textarea, 'JN.1, KP.2, XFG');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2', 'XFG'],
            }),
        );
    });

    test('handles mixed separators (comma and space)', async () => {
        const user = userEvent.setup();
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await user.type(textarea, 'JN.1, KP.2 XFG');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2', 'XFG'],
            }),
        );
    });

    test('filters out empty strings from multiple commas', async () => {
        const user = userEvent.setup();
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await user.type(textarea, 'JN.1,, KP.2');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2'],
            }),
        );
    });

    test('syncs textarea when page state changes externally', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole, rerender } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        // Initially empty
        expect(textarea).toHaveValue('');

        // Update page state externally
        const updatedPageState: WasapUntrackedFilter = {
            ...defaultPageState,
            excludeVariants: ['BA.1', 'BA.2'],
        };

        rerender(
            <UntrackedFilter
                pageState={updatedPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        // Textarea should sync
        await waitFor(() => {
            expect(textarea).toHaveValue('BA.1 BA.2');
        });
    });

    test('does not sync textarea when typing (prevents losing spaces)', async () => {
        const user = userEvent.setup();
        let currentState = defaultPageState;

        const setPageState = vi.fn((newState) => {
            currentState = newState;
        });

        const { getByRole, rerender } = render(
            <UntrackedFilter
                pageState={currentState}
                setPageState={setPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        // Type "JN.1 " (with trailing space)
        await user.type(textarea, 'JN.1 ');

        // Rerender with the updated state (simulating React's state update)
        rerender(
            <UntrackedFilter
                pageState={currentState}
                setPageState={setPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        // The textarea should still have the trailing space
        expect(textarea).toHaveValue('JN.1 ');
    });
});
