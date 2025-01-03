import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { allOrganisms, Organisms } from '../src/types/Organism.ts';

const organismOptions = {
    [Organisms.covid]: { placeholder: 'division', location: 'North America' },
    [Organisms.h5n1]: { placeholder: 'country', location: 'USA' },
    [Organisms.westNile]: { placeholder: 'country', location: 'USA' },
    [Organisms.rsvA]: { placeholder: 'country', location: 'USA' },
    [Organisms.rsvB]: { placeholder: 'country', location: 'USA' },
    [Organisms.mpox]: { placeholder: 'country', location: 'USA' },
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
                await sequencingEffortsPage.selectLocation(options.placeholder, options.location);
                await sequencingEffortsPage.selectDateRange('All times');

                await expect(sequencingEffortsPage.diagramTitle('Number sequences')).toBeVisible();
                await sequencingEffortsPage.expectToSeeNoComponentErrors();
            });
        });
    }
});
