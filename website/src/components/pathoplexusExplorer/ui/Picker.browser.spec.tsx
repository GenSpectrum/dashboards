import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Picker } from './Picker.tsx';

const OPTIONS = [
    { value: 'rsv_a', label: 'RSV-A' },
    { value: 'rsv_b', label: 'RSV-B' },
    { value: 'mpox', label: 'Mpox' },
];

async function opened(onSelect: (value: string | undefined) => void, value?: string) {
    const screen = await render(
        <Picker label='Pathogen' value={value} placeholder='choose one' options={OPTIONS} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Pathogen/ }));
    return screen;
}

describe('a picker', () => {
    test('offers its options as a list box controlled by the filter box', async () => {
        const screen = await opened(vi.fn());

        await expect.element(screen.getByRole('combobox')).toHaveFocus();
        await expect.element(screen.getByRole('listbox')).toBeVisible();
        expect(screen.getByRole('option').elements()).toHaveLength(3);
    });

    test('moves through the options with the arrow keys and picks the active one with Enter', async () => {
        const onSelect = vi.fn();
        await opened(onSelect);

        await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}{Enter}');

        expect(onSelect).toHaveBeenCalledWith('rsv_b');
    });

    test('picks the first match with Enter after narrowing', async () => {
        const onSelect = vi.fn();
        await opened(onSelect);

        await userEvent.keyboard('mp{Enter}');

        expect(onSelect).toHaveBeenCalledWith('mpox');
    });

    test('clears the choice with Enter when nothing else matches', async () => {
        const onSelect = vi.fn();
        await opened(onSelect, 'rsv_a');

        await userEvent.keyboard('zzz{Enter}');

        expect(onSelect).toHaveBeenCalledWith(undefined);
    });

    test('hands the focus back to its button after a choice', async () => {
        const screen = await opened(vi.fn());

        await userEvent.click(screen.getByRole('option', { name: 'RSV-B' }));

        await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
        await expect.element(screen.getByRole('button', { name: /Pathogen/ })).toHaveFocus();
    });

    test('hands the focus back to its button when dismissed', async () => {
        const screen = await opened(vi.fn());

        await userEvent.keyboard('{Escape}');

        await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
        await expect.element(screen.getByRole('button', { name: /Pathogen/ })).toHaveFocus();
    });
});
