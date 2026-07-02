import { userEvent } from '@vitest/browser/context';
import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionCombobox } from './CollectionCombobox';
import { it } from '../../../../../test-extend';
import type { CollectionSummary } from '../../../../types/Collection';

const makeCollection = (id: number, name: string): CollectionSummary => ({
    id,
    name,
    ownedBy: 1,
    organism: 'test',
    description: null,
    variantCount: 0,
    tags: [],
});

const collections = [makeCollection(1, 'Alpha'), makeCollection(2, 'Beta'), makeCollection(3, 'Gamma')];

describe('CollectionCombobox', () => {
    describe('onInputBlur', () => {
        it('calls onChange(null) when blurred with empty input', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(
                <CollectionCombobox collections={collections} value={collections[0]} onChange={onChange} />,
            );

            await getByRole('combobox').fill('');
            await userEvent.tab();

            expect(onChange).toHaveBeenCalledWith(null);
        });

        it('calls onChange with matched collection when blurred with an exact name', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(
                <CollectionCombobox collections={collections} value={null} onChange={onChange} />,
            );

            await getByRole('combobox').fill('Beta');
            await userEvent.tab();

            expect(onChange).toHaveBeenCalledWith(collections[1]);
        });

        it('calls onChange with matched collection when input has surrounding whitespace', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(
                <CollectionCombobox collections={collections} value={null} onChange={onChange} />,
            );

            await getByRole('combobox').fill('  Beta  ');
            await userEvent.tab();

            expect(onChange).toHaveBeenCalledWith(collections[1]);
        });

        it('shows error state and does not call onChange when blurred with an unrecognised name', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(
                <CollectionCombobox collections={collections} value={null} onChange={onChange} />,
            );

            await getByRole('combobox').fill('Unknown');
            await userEvent.tab();

            expect(onChange).not.toHaveBeenCalled();
            const wrapper = getByRole('combobox').element().closest('.input');
            await expect.element(wrapper as HTMLElement).toHaveClass('input-error');
        });

        it('clears error state when user starts typing after an invalid blur', async () => {
            const onChange = vi.fn();
            const { getByRole } = render(
                <CollectionCombobox collections={collections} value={null} onChange={onChange} />,
            );

            await getByRole('combobox').fill('Unknown');
            await userEvent.tab();

            const wrapper = getByRole('combobox').element().closest('.input');
            await expect.element(wrapper as HTMLElement).toHaveClass('input-error');

            await getByRole('combobox').fill('A');
            await expect.element(wrapper as HTMLElement).not.toHaveClass('input-error');
        });
    });

    describe('clear button', () => {
        it('is not rendered when input is empty', () => {
            const { getByLabelText } = render(
                <CollectionCombobox collections={collections} value={null} onChange={vi.fn()} />,
            );

            expect(getByLabelText('clear selection').elements()).toHaveLength(0);
        });

        it('is visible when a value is selected', async () => {
            const { getByLabelText } = render(
                <CollectionCombobox collections={collections} value={collections[0]} onChange={vi.fn()} />,
            );

            await expect.element(getByLabelText('clear selection')).toBeVisible();
        });

        it('clears the input and calls onChange(null) when clicked', async () => {
            const onChange = vi.fn();
            const { getByLabelText, getByRole } = render(
                <CollectionCombobox collections={collections} value={collections[0]} onChange={onChange} />,
            );

            await getByLabelText('clear selection').click();

            expect(onChange).toHaveBeenCalledWith(null);
            await expect.element(getByRole('combobox')).toHaveValue('');
        });

        it('disappears after being clicked', async () => {
            const onChange = vi.fn();
            const { getByLabelText } = render(
                <CollectionCombobox collections={collections} value={collections[0]} onChange={onChange} />,
            );

            await getByLabelText('clear selection').click();

            expect(getByLabelText('clear selection').elements()).toHaveLength(0);
        });
    });

    describe('filtering', () => {
        it('shows only matching items when typing', async () => {
            const { getByRole, getByText } = render(
                <CollectionCombobox collections={collections} value={null} onChange={vi.fn()} />,
            );

            await getByRole('button', { name: 'toggle menu' }).click();
            await getByRole('combobox').fill('Al');

            await expect.element(getByText('Alpha')).toBeVisible();
            expect(getByText('Beta').elements()).toHaveLength(0);
            expect(getByText('Gamma').elements()).toHaveLength(0);
        });

        it('shows "No variants found" when no collections match the input', async () => {
            const { getByRole, getByText } = render(
                <CollectionCombobox collections={collections} value={null} onChange={vi.fn()} />,
            );

            await getByRole('button', { name: 'toggle menu' }).click();
            await getByRole('combobox').fill('zzz');

            await expect.element(getByText('No variants found.')).toBeVisible();
        });
    });
});
