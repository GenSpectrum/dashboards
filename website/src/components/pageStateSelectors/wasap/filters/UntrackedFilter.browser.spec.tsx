import { type UseQueryResult } from '@tanstack/react-query';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { UntrackedFilter } from './UntrackedFilter';
import { it } from '../../../../../test-extend';
import type { WasapUntrackedFilter } from '../../../../views/pageStateHandlers/WasapPageStateHandler';

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

    it('allows typing spaces without them disappearing', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await textarea.fill('JN.1 ');

        await expect.element(textarea).toHaveValue('JN.1 ');
    });

    it('parses space-separated variants', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await textarea.fill('JN.1 KP.2');

        // Should have been called with parsed variants
        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2'],
            }),
        );
    });

    it('parses comma-separated variants', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await textarea.fill('JN.1, KP.2, XFG');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2', 'XFG'],
            }),
        );
    });

    it('handles mixed separators (comma and space)', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await textarea.fill('JN.1, KP.2 XFG');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2', 'XFG'],
            }),
        );
    });

    it('filters out empty strings from multiple commas', async () => {
        const mockSetPageState = vi.fn();

        const { getByRole } = render(
            <UntrackedFilter
                pageState={defaultPageState}
                setPageState={mockSetPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        const textarea = getByRole('textbox');

        await textarea.fill('JN.1,, KP.2');

        expect(mockSetPageState).toHaveBeenCalledWith(
            expect.objectContaining({
                excludeVariants: ['JN.1', 'KP.2'],
            }),
        );
    });

    it('syncs textarea when page state changes externally', async () => {
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
        await expect.element(textarea).toHaveValue('');

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
        await expect.element(textarea).toHaveValue('BA.1 BA.2');
    });

    it('does not sync textarea when typing (prevents losing spaces)', async () => {
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

        // Fill "JN.1 " (with trailing space)
        await textarea.fill('JN.1 ');

        // Rerender with the updated state (simulating React's state update)
        rerender(
            <UntrackedFilter
                pageState={currentState}
                setPageState={setPageState}
                cladeLineageQueryResult={mockCladeLineageQueryResult}
            />,
        );

        // The textarea should still have the trailing space
        await expect.element(textarea).toHaveValue('JN.1 ');
    });
});
