import { userEvent } from '@vitest/browser/context';
import { delay, http } from 'msw';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { AdvancedQueryFilter } from './AdvancedQueryFilter.tsx';
import { DUMMY_LAPIS_URL } from '../../../routeMocker.ts';
import { it, worker } from '../../../test-extend';
import { withQueryProvider } from '../../backendApi/withQueryProvider.tsx';

const AdvancedQueryFilterWithProvider = withQueryProvider(AdvancedQueryFilter);

describe('AdvancedQueryFilter', () => {
    it('does not render when disabled', async () => {
        const { getByRole } = render(<AdvancedQueryFilterWithProvider enabled={false} lapisUrl={DUMMY_LAPIS_URL} />);

        await expect.element(getByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows input when enabled', async () => {
        const { getByRole } = render(<AdvancedQueryFilterWithProvider enabled lapisUrl={DUMMY_LAPIS_URL} />);

        await expect.element(getByRole('textbox')).toBeVisible();
    });

    it('calls onInput with undefined when input is cleared', async () => {
        const onInput = vi.fn();

        const { getByRole } = render(
            <AdvancedQueryFilterWithProvider value='A123T' onInput={onInput} enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        const input = getByRole('textbox');
        await userEvent.clear(input);

        expect(onInput).toHaveBeenCalledWith(undefined);
    });

    it('validates query and calls onInput with value on success', async ({ routeMockers }) => {
        const onInput = vi.fn();

        routeMockers.lapis.mockPostQueryParse(
            { queries: ['A123T'] },
            { data: [{ type: 'success', filter: { type: 'StringEquals', column: 'x', value: 'y' } }] },
        );

        const { getByRole } = render(
            <AdvancedQueryFilterWithProvider onInput={onInput} enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        const input = getByRole('textbox');
        await userEvent.type(input, 'A123T');

        await expect.poll(() => onInput).toHaveBeenCalledWith('A123T');
        expect(onInput).not.toHaveBeenCalledWith(undefined);
    });

    it('shows checkmark after successful validation', async ({ routeMockers }) => {
        routeMockers.lapis.mockPostQueryParse(
            { queries: ['A123T'] },
            { data: [{ type: 'success', filter: { type: 'StringEquals', column: 'x', value: 'y' } }] },
        );

        const { getByRole, getByTitle } = render(
            <AdvancedQueryFilterWithProvider enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        await userEvent.type(getByRole('textbox'), 'A123T');

        await expect.element(getByTitle('Advanced query is valid')).toBeVisible();
    });

    it('shows error icon with message tooltip on parse failure', async ({ routeMockers }) => {
        const onInput = vi.fn();

        routeMockers.lapis.mockPostQueryParse(
            { queries: ['invalid!!'] },
            { data: [{ type: 'failure', error: 'Unexpected token at position 7' }] },
        );

        const { getByRole, getByTitle } = render(
            <AdvancedQueryFilterWithProvider onInput={onInput} enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        await userEvent.type(getByRole('textbox'), 'invalid!!');

        await expect.element(getByTitle('Invalid advanced query: Unexpected token at position 7')).toBeVisible();
        expect(onInput).not.toHaveBeenCalled();
    });

    it('shows validating indicator while waiting for validation result', async () => {
        worker.use(
            http.post(`${DUMMY_LAPIS_URL}/query/parse`, async () => {
                await delay('infinite');
            }),
        );

        const { getByRole, getByTitle } = render(
            <AdvancedQueryFilterWithProvider enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        await userEvent.type(getByRole('textbox'), 'A123T');

        await expect.element(getByTitle('Validating')).toBeVisible();
    });

    it('shows error icon with network error tooltip when LAPIS is unreachable', async ({ routeMockers }) => {
        routeMockers.lapis.mockLapisDown();

        const onInput = vi.fn();

        const { getByRole, getByTitle } = render(
            <AdvancedQueryFilterWithProvider onInput={onInput} enabled lapisUrl={DUMMY_LAPIS_URL} />,
        );

        await userEvent.type(getByRole('textbox'), 'A123T');

        await expect.element(getByTitle('Invalid advanced query: Validation is not possible right now.')).toBeVisible();
        expect(onInput).not.toHaveBeenCalled();
    });
});
