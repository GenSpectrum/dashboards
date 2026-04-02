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
        ownedBy: 'user1',
        organism: ORGANISM,
        description: 'A test collection',
        variants: [
            {
                type: 'query' as const,
                id: 10,
                collectionId: 1,
                name: 'Variant A',
                description: null,
                countQuery: '{}',
                coverageQuery: null,
            },
            {
                type: 'query' as const,
                id: 11,
                collectionId: 1,
                name: 'Variant B',
                description: null,
                countQuery: '{}',
                coverageQuery: null,
            },
            {
                type: 'query' as const,
                id: 12,
                collectionId: 1,
                name: 'Variant C',
                description: null,
                countQuery: '{}',
                coverageQuery: null,
            },
        ],
    },
    {
        id: 2,
        name: 'Another collection',
        ownedBy: 'user1',
        organism: ORGANISM,
        description: null,
        variants: [],
    },
];

describe('CollectionsOverview', () => {
    it('shows the headline and collections table on success', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollections(mockCollections, ORGANISM);

        const { getByText, getByRole } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('My first collection')).toBeVisible();
        await expect.element(getByText('Another collection')).toBeVisible();
        await expect.element(getByRole('table')).toBeVisible();
        await expect.element(getByText('3')).toBeVisible(); // variant count for first collection
        await expect.element(getByText('0')).toBeVisible(); // variant count for second collection
    });

    it('shows the headline and empty message when there are no collections', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollections([], ORGANISM);

        const { getByText } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('No collections yet.')).toBeVisible();
    });

    it('shows the headline and error message when the fetch fails', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollections([], ORGANISM, 500);
        astro.mockLog();

        const { getByText } = render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} />);

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Failed to load collections. Please try reloading the page.')).toBeVisible();
    });
});
