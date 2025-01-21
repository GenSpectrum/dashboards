import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismsWithView } from './helpers.ts';
import { Organisms } from '../src/types/Organism.ts';
import { compareVariantsViewKey } from '../src/views/viewKeys';

const organismOptions = {
    [Organisms.covid]: { lineage: 'JN.1*', lineageFieldPlaceholder: 'Nextclade pango lineage' },
    [Organisms.h5n1]: { lineage: '2.3.4.4b', lineageFieldPlaceholder: 'Clade' },
    [Organisms.westNile]: { lineage: '1A', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvA]: { lineage: 'A.D.5.2', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvB]: { lineage: 'B.D.E.1', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.mpox]: { lineage: 'F.1', lineageFieldPlaceholder: 'Lineage' },
};

test.describe('The Compare Variants page', () => {
    for (const organism of organismsWithView(compareVariantsViewKey)) {
        test(`should show diagrams after selecting two variants ${organism}`, async ({ compareVariantsPage }) => {
            const options = organismOptions[organism];

            await compareVariantsPage.goto(organism);
            await expect(compareVariantsPage.selectVariantsMessage).toBeVisible();
            await expect(compareVariantsPage.diagramTitle('Prevalence over time')).not.toBeVisible();

            await compareVariantsPage.addVariant(options.lineageFieldPlaceholder, options.lineage);
            await compareVariantsPage.addVariant(options.lineageFieldPlaceholder, options.lineage);
            await compareVariantsPage.submitFilters();

            await expect(compareVariantsPage.diagramTitle('Prevalence over time')).toBeVisible();
            await compareVariantsPage.expectToSeeNoComponentErrors();
        });
    }
});
