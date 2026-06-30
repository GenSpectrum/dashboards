import { userEvent } from '@vitest/browser/context';
import { beforeEach, describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { TagInput } from './TagInput.tsx';
import { backendRouteMocker, it } from '../../../../test-extend.ts';
import { withQueryProvider } from '../../../backendApi/withQueryProvider.tsx';

const TagInputWithProvider = withQueryProvider(TagInput);

const PLACEHOLDER = 'Add tags (Enter, comma, or space to confirm)';

beforeEach(() => {
    backendRouteMocker.mockGetCollectionTags();
});

describe('TagInput', () => {
    it('renders existing tags', async () => {
        const { getByText } = render(<TagInputWithProvider tags={['flu', 'europe']} onChange={vi.fn()} />);

        await expect.element(getByText('flu')).toBeVisible();
        await expect.element(getByText('europe')).toBeVisible();
    });

    it('adds a tag on Enter', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={[]} onChange={onChange} />);

        await getByPlaceholder(PLACEHOLDER).fill('influenza');
        await userEvent.keyboard('{Enter}');

        expect(onChange).toHaveBeenCalledWith(['influenza']);
    });

    it('adds a tag on comma', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={[]} onChange={onChange} />);

        await getByPlaceholder(PLACEHOLDER).fill('influenza');
        await userEvent.keyboard(',');

        expect(onChange).toHaveBeenCalledWith(['influenza']);
    });

    it('adds a tag on space', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={[]} onChange={onChange} />);

        await getByPlaceholder(PLACEHOLDER).fill('influenza');
        await userEvent.keyboard(' ');

        expect(onChange).toHaveBeenCalledWith(['influenza']);
    });

    it('adds a tag on blur', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={[]} onChange={onChange} />);

        await getByPlaceholder(PLACEHOLDER).fill('influenza');
        await userEvent.tab();

        expect(onChange).toHaveBeenCalledWith(['influenza']);
    });

    it('lowercases tags', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={[]} onChange={onChange} />);

        await getByPlaceholder(PLACEHOLDER).fill('Influenza');
        await userEvent.keyboard('{Enter}');

        expect(onChange).toHaveBeenCalledWith(['influenza']);
    });

    it('does not add duplicate tags', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={['flu']} onChange={onChange} />);

        await getByPlaceholder('').fill('flu');
        await userEvent.keyboard('{Enter}');

        expect(onChange).not.toHaveBeenCalled();
    });

    it('removes a tag when the remove button is clicked', async () => {
        const onChange = vi.fn();
        const { getByRole } = render(<TagInputWithProvider tags={['flu', 'covid']} onChange={onChange} />);

        await getByRole('button', { name: 'Remove tag flu' }).click();

        expect(onChange).toHaveBeenCalledWith(['covid']);
    });

    it('removes the last tag on Backspace when the input is empty', async () => {
        const onChange = vi.fn();
        const { getByPlaceholder } = render(<TagInputWithProvider tags={['flu', 'covid']} onChange={onChange} />);

        await userEvent.click(getByPlaceholder(''));
        await userEvent.keyboard('{Backspace}');

        expect(onChange).toHaveBeenCalledWith(['flu']);
    });
});
