import { describe, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionForm } from './CollectionForm.tsx';
import { testOrganismsConfig } from '../../../../routeMocker.ts';
import { it } from '../../../../test-extend.ts';
import type { DashboardsConfig } from '../../../config.ts';
import type { VariantUpdate } from '../../../types/Collection.ts';
import { Organisms } from '../../../types/Organism.ts';

const ORGANISM = Organisms.covid;

const TEST_CONFIG = {
    dashboards: {
        organisms: testOrganismsConfig,
        auth: { github: { clientId: 'test' } },
    },
} as unknown as DashboardsConfig;

const DEFAULT_PROPS = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    isSuccess: false,
    successMessage: '',
    submitLabel: 'Create collection',
    organism: ORGANISM,
    config: TEST_CONFIG,
};

const INITIAL_VALUES = {
    name: 'My collection',
    description: 'A description',
    variants: [{ type: 'filterObject' as const, name: 'Variant 1', filterObject: {} } satisfies VariantUpdate],
};

describe('CollectionForm', () => {
    it('shows "New collection" heading when no initialValues are provided', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(<CollectionForm {...DEFAULT_PROPS} />);

        await expect.element(getByRole('heading', { level: 1 })).toHaveTextContent('New collection');
    });

    it('shows "Edit collection" heading when initialValues are provided', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(<CollectionForm {...DEFAULT_PROPS} initialValues={INITIAL_VALUES} />);

        await expect.element(getByRole('heading', { level: 1 })).toHaveTextContent('Edit collection');
    });

    it('"Add variant" button adds a new variant row', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(<CollectionForm {...DEFAULT_PROPS} />);

        await getByRole('button', { name: 'Add variant' }).click();

        // With two variants, Remove buttons appear
        await expect.element(getByRole('button', { name: 'Remove' }).first()).toBeVisible();
    });

    it('default variant has "Use advanced query" unchecked', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByRole } = render(<CollectionForm {...DEFAULT_PROPS} />);

        await expect.element(getByRole('checkbox', { name: 'Use advanced query instead' })).not.toBeChecked();
    });

    it('calls onSubmit with the correct values when the form is submitted', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const onSubmit = vi.fn();

        const { getByRole, getByPlaceholder } = render(
            <CollectionForm {...DEFAULT_PROPS} onSubmit={onSubmit} submitLabel='Create collection' />,
        );

        await getByPlaceholder('A name to identify this collection.').fill('Test name');
        await getByRole('button', { name: 'Create collection' }).click();

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test name',
                description: '',
            }),
        );
    });
});
