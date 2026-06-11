import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionsOverview } from './CollectionsOverview';
import { it } from '../../../../test-extend';
import { Organisms } from '../../../types/Organism';

const ORGANISM = Organisms.covid;
const HEADLINE = 'SARS-CoV-2 Collections';

const mockCollections = [
    {
        id: 1,
        name: 'My first collection',
        ownedBy: 1,
        organism: ORGANISM,
        description: 'A test collection',
        variantCount: 3,
    },
    {
        id: 2,
        name: 'Another collection',
        ownedBy: 1,
        organism: ORGANISM,
        description: null,
        variantCount: 0,
    },
];

describe('CollectionsOverview', () => {
    it('shows the headline and collections table on success', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(mockCollections, ORGANISM, 200, true);

        const { getByText, getByRole } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('My first collection')).toBeVisible();
        await expect.element(getByText('Another collection')).toBeVisible();
        await expect.element(getByRole('grid')).toBeVisible();
        await expect.element(getByText('3')).toBeVisible(); // variant count for first collection
        await expect.element(getByText('0')).toBeVisible(); // variant count for second collection
    });

    it('shows the headline and empty message when there are no collections', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 200, true);

        const { getByText } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('No collections yet.')).toBeVisible();
    });

    it('shows the headline and error message when the fetch fails', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 500, true);
        astro.mockLog();

        const { getByText } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Failed to load collections. Please try reloading the page.')).toBeVisible();
    });
});
