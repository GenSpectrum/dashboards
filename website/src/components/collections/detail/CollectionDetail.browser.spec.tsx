import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionDetail } from './CollectionDetail';
import { it } from '../../../../test-extend';
import { Organisms } from '../../../types/Organism';
import type { FilterObject } from '../../../types/Collection';

const ORGANISM = Organisms.covid;
const LINEAGE_FIELD = 'pangoLineage';

const mockCollection = {
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
            name: 'Alpha',
            description: 'A query-based variant',
            countQuery: 'variantQuery=ABC',
            coverageQuery: null,
        },
        {
            type: 'filterObject' as const,
            id: 11,
            collectionId: 1,
            name: 'Beta',
            description: 'A filter-object variant',
            filterObject: {
                nucleotideMutations: ['A123T', 'G456C'],
                [LINEAGE_FIELD]: 'A.B.1'
            } as unknown as FilterObject,
        },
    ],
};

describe('CollectionDetail', () => {
    it('shows the collection name and variants on success', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollection('1', mockCollection);

        const { getByText } = render(<CollectionDetail organism={ORGANISM} id='1' />);

        await expect.element(getByText('My first collection')).toBeVisible();
        await expect.element(getByText('A test collection')).toBeVisible();
        await expect.element(getByText('SARS-CoV-2 collection owned by user1')).toBeVisible();
        await expect.element(getByText('Alpha')).toBeVisible();
        await expect.element(getByText('A query-based variant')).toBeVisible();
        await expect.element(getByText('variantQuery=ABC')).toBeVisible();
        await expect.element(getByText('Beta')).toBeVisible();
        await expect.element(getByText('A filter-object variant')).toBeVisible();
        await expect.element(getByText('A123T, G456C')).toBeVisible();
        await expect.element(getByText('A.B.1')).toBeVisible();
    });

    it('shows an error message when the fetch fails', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollection('1', mockCollection, 500);
        astro.mockLog();

        const { getByText } = render(<CollectionDetail organism={ORGANISM} id='1' />);

        await expect.element(getByText('Failed to load collection. Please try reloading the page.')).toBeVisible();
    });
});
