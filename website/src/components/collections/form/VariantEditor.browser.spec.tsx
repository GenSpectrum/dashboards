import { describe, expect, it as itVitest, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { VariantEditor } from './VariantEditor.tsx';
import { it } from '../../../../test-extend.ts';
import type { VariantUpdate } from '../../../types/Collection.ts';

const FILTER_VARIANT: VariantUpdate = { type: 'filterObject', name: 'JN.1*', filterObject: {} };
const QUERY_VARIANT: VariantUpdate = {
    type: 'query',
    name: 'Switzerland',
    countQuery: "country = 'Switzerland'",
};

describe('VariantEditor', () => {
    it('renders Name and Description labels', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByText } = render(
            <VariantEditor
                index={0}
                variant={FILTER_VARIANT}
                onChange={vi.fn()}
                onRemove={vi.fn()}
                canRemove={false}
                lineageFields={[]}
            />,
        );

        await expect.element(getByText('Name')).toBeVisible();
        await expect.element(getByText('Description')).toBeVisible();
    });

    it('"Use advanced query" checkbox is unchecked for filterObject variant', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(
            <VariantEditor
                index={0}
                variant={FILTER_VARIANT}
                onChange={vi.fn()}
                onRemove={vi.fn()}
                canRemove={false}
                lineageFields={[]}
            />,
        );

        await expect.element(getByRole('checkbox')).not.toBeChecked();
    });

    itVitest('"Use advanced query" checkbox is checked for query variant', async () => {
        const { getByRole } = render(
            <VariantEditor
                index={0}
                variant={QUERY_VARIANT}
                onChange={vi.fn()}
                onRemove={vi.fn()}
                canRemove={false}
                lineageFields={[]}
            />,
        );

        await expect.element(getByRole('checkbox')).toBeChecked();
    });

    it('clicking the checkbox calls onChange with type query', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const onChange = vi.fn();

        const { getByRole } = render(
            <VariantEditor
                index={0}
                variant={FILTER_VARIANT}
                onChange={onChange}
                onRemove={vi.fn()}
                canRemove={false}
                lineageFields={[]}
            />,
        );

        await getByRole('checkbox').click();

        expect(onChange).toHaveBeenCalledWith(0, expect.objectContaining({ type: 'query' }));
    });

    it('Remove button is visible when canRemove is true', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(
            <VariantEditor
                index={0}
                variant={FILTER_VARIANT}
                onChange={vi.fn()}
                onRemove={vi.fn()}
                canRemove={true}
                lineageFields={[]}
            />,
        );

        await expect.element(getByRole('button', { name: 'Remove' })).toBeVisible();
    });

    it('clicking Remove calls onRemove with the correct index', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const onRemove = vi.fn();

        const { getByRole } = render(
            <VariantEditor
                index={2}
                variant={FILTER_VARIANT}
                onChange={vi.fn()}
                onRemove={onRemove}
                canRemove={true}
                lineageFields={[]}
            />,
        );

        await getByRole('button', { name: 'Remove' }).click();

        expect(onRemove).toHaveBeenCalledWith(2);
    });

    itVitest('changing the name input calls onChange with the updated name', async () => {
        const onChange = vi.fn();

        const { getByPlaceholder } = render(
            <VariantEditor
                index={0}
                variant={QUERY_VARIANT}
                onChange={onChange}
                onRemove={vi.fn()}
                canRemove={false}
                lineageFields={[]}
            />,
        );

        await getByPlaceholder('Variant name').fill('New name');

        expect(onChange).toHaveBeenCalledWith(0, expect.objectContaining({ name: 'New name' }));
    });
});
