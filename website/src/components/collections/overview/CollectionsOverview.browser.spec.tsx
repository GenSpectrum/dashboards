import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionsOverview } from './CollectionsOverview';
import { it } from '../../../../test-extend';
import { Organisms } from '../../../types/Organism';

const ORGANISM = Organisms.covid;
const HEADLINE = 'SARS-CoV-2 Collections';
const SYSTEM_USER_ID = 1;

const communityCollection = {
    id: 1,
    name: 'Community collection',
    ownedBy: 2,
    organism: ORGANISM,
    description: 'A user-submitted collection',
    variantCount: 3,
};

const officialCollection = {
    id: 2,
    name: 'Official collection',
    ownedBy: SYSTEM_USER_ID,
    organism: ORGANISM,
    description: null,
    variantCount: 0,
};

const allCollections = [communityCollection, officialCollection];

function renderOverview() {
    return render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} systemUserId={SYSTEM_USER_ID} />);
}

describe('CollectionsOverview', () => {
    it('shows the headline and community collections by default', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200);

        const { getByText, getByRole } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByRole('grid')).toBeVisible();
    });

    it('hides official collections by default', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200);

        const { getByText } = renderOverview();

        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByText('Official collection')).not.toBeInTheDocument();
    });

    it('shows only official collections when Official is selected', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200);

        const { getByText } = renderOverview();

        await getByText('Official').click();

        await expect.element(getByText('Official collection')).toBeVisible();
        await expect.element(getByText('Community collection')).not.toBeInTheDocument();
    });

    it('shows all collections when All is selected', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200);

        const { getByText } = renderOverview();

        await getByText('All').click();

        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByText('Official collection')).toBeVisible();
    });

    it('shows the headline and empty message when there are no collections', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 200);

        const { getByText } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('No collections yet.')).toBeVisible();
    });

    it('shows the headline and error message when the fetch fails', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 500);
        astro.mockLog();

        const { getByText } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Failed to load collections. Please try reloading the page.')).toBeVisible();
    });
});
