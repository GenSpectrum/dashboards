import { userEvent } from '@vitest/browser/context';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { CollectionsOverview } from './CollectionsOverview';
import { it } from '../../../../test-extend';
import { Organisms } from '../../../types/Organism';

const ORGANISM = Organisms.covid;
const HEADLINE = 'SARS-CoV-2 Collections';
const SYSTEM_USER_ID = 1;
const TAG_INPUT_PLACEHOLDER = 'Add tags (Enter, comma, or space to confirm)';

const communityCollection = {
    id: 1,
    name: 'Community collection',
    ownedBy: 2,
    organism: ORGANISM,
    description: 'A user-submitted collection',
    variantCount: 3,
    tags: ['europe', 'flu'],
};

const officialCollection = {
    id: 2,
    name: 'Official collection',
    ownedBy: SYSTEM_USER_ID,
    organism: ORGANISM,
    description: null,
    variantCount: 0,
    tags: [],
};

const allCollections = [communityCollection, officialCollection];

const taggedComEuropeFlu = {
    id: 3,
    name: 'Euro-Flu Community',
    ownedBy: 2,
    organism: ORGANISM,
    description: null,
    variantCount: 2,
    tags: ['europe', 'flu'],
};

const taggedComAsia = {
    id: 4,
    name: 'Asia Community',
    ownedBy: 2,
    organism: ORGANISM,
    description: null,
    variantCount: 1,
    tags: ['asia', 'flu'],
};

const taggedComEurope = {
    id: 5,
    name: 'Europe-Only Community',
    ownedBy: 2,
    organism: ORGANISM,
    description: null,
    variantCount: 1,
    tags: ['europe'],
};

const taggedOffEurope = {
    id: 6,
    name: 'Europe Official',
    ownedBy: SYSTEM_USER_ID,
    organism: ORGANISM,
    description: null,
    variantCount: 0,
    tags: ['europe'],
};

const taggedOffNone = {
    id: 7,
    name: 'NoTags Official',
    ownedBy: SYSTEM_USER_ID,
    organism: ORGANISM,
    description: null,
    variantCount: 0,
    tags: [],
};

const taggedCollections = [taggedComEuropeFlu, taggedComAsia, taggedComEurope, taggedOffEurope, taggedOffNone];

function renderOverview() {
    return render(<CollectionsOverview organism={ORGANISM} isLoggedIn={false} systemUserId={SYSTEM_USER_ID} />);
}

describe('CollectionsOverview', () => {
    it('shows the headline and community collections by default', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200, true);

        const { getByText, getByRole } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByRole('grid')).toBeVisible();
    });

    it('hides official collections by default', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200, true);

        const { getByText } = renderOverview();

        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByText('Official collection')).not.toBeInTheDocument();
    });

    it('shows only official collections when Official is selected', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200, true);

        const { getByText } = renderOverview();

        await getByText('Official').click();

        await expect.element(getByText('Official collection')).toBeVisible();
        await expect.element(getByText('Community collection')).not.toBeInTheDocument();
    });

    it('shows all collections when All is selected', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries(allCollections, ORGANISM, 200, true);

        const { getByText } = renderOverview();

        await getByText('All').click();

        await expect.element(getByText('Community collection')).toBeVisible();
        await expect.element(getByText('Official collection')).toBeVisible();
    });

    it('shows the headline and empty message when there are no collections', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 200, true);

        const { getByText } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('No collections yet.')).toBeVisible();
    });

    it('shows the headline and error message when the fetch fails', async ({ routeMockers: { astro } }) => {
        astro.mockGetCollectionSummaries([], ORGANISM, 500, true);
        astro.mockLog();

        const { getByText } = renderOverview();

        await expect.element(getByText(HEADLINE)).toBeVisible();
        await expect.element(getByText('Failed to load collections. Please try reloading the page.')).toBeVisible();
    });

    describe('tag filter', () => {
        it('filters by a single tag in All mode', async ({ routeMockers: { astro } }) => {
            astro.mockGetCollectionSummaries(taggedCollections, ORGANISM, 200, true);
            const { getByText, getByPlaceholder } = renderOverview();

            await getByText('All').click();
            await getByPlaceholder(TAG_INPUT_PLACEHOLDER).fill('europe');
            await userEvent.keyboard('{Enter}');

            await expect.element(getByText('Euro-Flu Community')).toBeVisible();
            await expect.element(getByText('Europe-Only Community')).toBeVisible();
            await expect.element(getByText('Europe Official')).toBeVisible();
            await expect.element(getByText('Asia Community')).not.toBeInTheDocument();
            await expect.element(getByText('NoTags Official')).not.toBeInTheDocument();
        });

        it('filters by multiple tags in All mode', async ({ routeMockers: { astro } }) => {
            astro.mockGetCollectionSummaries(taggedCollections, ORGANISM, 200, true);
            const { getByText, getByPlaceholder } = renderOverview();

            await getByText('All').click();
            await getByPlaceholder(TAG_INPUT_PLACEHOLDER).fill('europe');
            await userEvent.keyboard('{Enter}');
            await getByPlaceholder('').fill('flu');
            await userEvent.keyboard('{Enter}');

            await expect.element(getByText('Euro-Flu Community')).toBeVisible();
            await expect.element(getByText('Europe-Only Community')).not.toBeInTheDocument();
            await expect.element(getByText('Europe Official')).not.toBeInTheDocument();
            await expect.element(getByText('Asia Community')).not.toBeInTheDocument();
            await expect.element(getByText('NoTags Official')).not.toBeInTheDocument();
        });

        it('applies tag filter within Community mode', async ({ routeMockers: { astro } }) => {
            astro.mockGetCollectionSummaries(taggedCollections, ORGANISM, 200, true);
            const { getByText, getByPlaceholder } = renderOverview();

            await getByPlaceholder(TAG_INPUT_PLACEHOLDER).fill('europe');
            await userEvent.keyboard('{Enter}');

            await expect.element(getByText('Euro-Flu Community')).toBeVisible();
            await expect.element(getByText('Europe-Only Community')).toBeVisible();
            await expect.element(getByText('Europe Official')).not.toBeInTheDocument();
            await expect.element(getByText('Asia Community')).not.toBeInTheDocument();
            await expect.element(getByText('NoTags Official')).not.toBeInTheDocument();
        });

        it('shows filter-empty message when tag filter excludes all collections', async ({
            routeMockers: { astro },
        }) => {
            astro.mockGetCollectionSummaries(taggedCollections, ORGANISM, 200, true);
            const { getByText, getByPlaceholder } = renderOverview();

            await getByText('All').click();
            await getByPlaceholder(TAG_INPUT_PLACEHOLDER).fill('nonexistent');
            await userEvent.keyboard('{Enter}');

            await expect.element(getByText('No collections match the selected filters.')).toBeVisible();
            await expect.element(getByText('No collections yet.')).not.toBeInTheDocument();
        });

        it('shows filter-empty message when community/official filter excludes all collections', async ({
            routeMockers: { astro },
        }) => {
            astro.mockGetCollectionSummaries([communityCollection], ORGANISM, 200, true);
            const { getByText } = renderOverview();

            await getByText('Official').click();

            await expect.element(getByText('No collections match the selected filters.')).toBeVisible();
            await expect.element(getByText('No collections yet.')).not.toBeInTheDocument();
        });
    });
});
