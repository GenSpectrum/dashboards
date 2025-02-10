import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { allOrganisms, Organisms } from '../src/types/Organism.ts';

const organismOptions = {
    [Organisms.covid]: { location: 'North America' },
    [Organisms.h5n1]: { location: 'USA' },
    [Organisms.flu]: { location: 'Switzerland' },
    [Organisms.westNile]: { location: 'Austria' },
    [Organisms.rsvA]: { location: 'USA' },
    [Organisms.rsvB]: { location: 'USA' },
    [Organisms.mpox]: { location: 'USA' },
    [Organisms.ebolaZaire]: { location: 'Gabon' },
};

test.describe('The Sequencing Efforts Page', () => {
    for (const organism of allOrganisms) {
        test.describe(organism, () => {
            test(`should allow selecting location and date range and then show diagrams`, async ({
                sequencingEffortsPage,
            }) => {
                const options = organismOptions[organism];

                await sequencingEffortsPage.goto(organism);
                await sequencingEffortsPage.expectToSeeNoComponentErrors();
                await sequencingEffortsPage.selectDateRange('All times');
                await sequencingEffortsPage.selectLocation(options.location);
                await sequencingEffortsPage.submitFilters();

                await expect(sequencingEffortsPage.diagramTitle('Number Sequences')).toBeVisible();
                await sequencingEffortsPage.expectToSeeNoComponentErrors();
            });
        });
    }
});
