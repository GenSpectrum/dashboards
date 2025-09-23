import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { allOrganisms, Organisms } from '../src/types/Organism.ts';

const organismOptions: Record<string, { location: string; skip?: true }> = {
    [Organisms.covid]: { location: 'North America' },
    [Organisms.influenzaA]: { location: 'Switzerland' },
    [Organisms.h5n1]: { location: 'USA' },
    [Organisms.h1n1pdm]: { location: 'USA' },
    [Organisms.h3n2]: { location: 'USA' },
    [Organisms.influenzaB]: { location: 'USA' },
    [Organisms.victoria]: { location: 'USA' },
    [Organisms.westNile]: { location: 'Austria' },
    [Organisms.rsvA]: { location: 'USA' },
    [Organisms.rsvB]: { location: 'USA' },
    [Organisms.mpox]: { location: 'USA' },
    [Organisms.ebolaSudan]: { location: 'Uganda' },
    [Organisms.ebolaZaire]: { location: 'Gabon' },
    [Organisms.cchf]: { location: 'Turkey' },
    [Organisms.denv1]: { location: 'China' },
    [Organisms.denv2]: { location: 'India', skip: true },
    [Organisms.denv3]: { location: 'Brazil' },
    [Organisms.denv4]: { location: 'USA' },
    [Organisms.measles]: { location: 'USA' },
};

test.describe('The Sequencing Efforts Page', () => {
    for (const organism of allOrganisms) {
        const options = organismOptions[organism];

        if (options.skip) {
            continue;
        }

        test.describe(organism, () => {
            test(`should allow selecting location and date range and then show diagrams`, async ({
                sequencingEffortsPage,
            }) => {
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

    test('should let me change the location without committing the deletion of the old location', async ({
        sequencingEffortsPage,
    }) => {
        await sequencingEffortsPage.goto(Organisms.h5n1);
        await sequencingEffortsPage.expectToSeeNoComponentErrors();
        await sequencingEffortsPage.selectDateRange('All times');
        await sequencingEffortsPage.selectLocation('Austria');
        await expect(sequencingEffortsPage.locationField).toHaveValue('Austria');

        await sequencingEffortsPage.locationField.click();
        await sequencingEffortsPage.page.keyboard.press('Backspace');
        await sequencingEffortsPage.page.keyboard.press('Backspace');
        await sequencingEffortsPage.page
            .getByRole('option', { name: /^Australia/i, exact: true })
            .first()
            .click();

        await expect(sequencingEffortsPage.locationField).toHaveValue('Australia');
    });
});
