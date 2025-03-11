import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { organismsWithView } from './helpers.ts';
import { Organisms } from '../src/types/Organism.ts';
import { compareVariantsViewKey } from '../src/views/viewKeys';

const organismOptions = {
    [Organisms.covid]: { lineage: 'JN.1*', lineageFieldPlaceholder: 'Nextclade pango lineage' },
    [Organisms.h5n1]: { lineage: '2.3.4.4b', lineageFieldPlaceholder: 'Clade' },
    [Organisms.h1n1pdm]: { lineage: '6B.1A.5a.2a.1', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.h3n2]: { lineage: '3C.2a1b', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.victoria]: { lineage: 'V1A.3a.2', lineageFieldPlaceholder: 'Clade HA' },
    [Organisms.westNile]: { lineage: '1A', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvA]: { lineage: 'A.D.5.2', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.rsvB]: { lineage: 'B.D.E.1', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.mpox]: { lineage: 'F.1', lineageFieldPlaceholder: 'Lineage' },
    [Organisms.ebolaSudan]: { mutation: 'G5902T' },
    [Organisms.ebolaZaire]: { mutation: 'T18365C' },
    [Organisms.cchf]: { mutation: 'M:G3565A' },
};

test.describe('The Compare Variants page', () => {
    for (const organism of organismsWithView(compareVariantsViewKey)) {
        test(`should show diagrams after selecting two variants ${organism}`, async ({ compareVariantsPage }) => {
            const options = organismOptions[organism];

            await compareVariantsPage.goto(organism);
            await expect(compareVariantsPage.selectVariantsMessage).toBeVisible();
            await expect(compareVariantsPage.diagramTitle('Prevalence Over Time')).not.toBeVisible();

            await compareVariantsPage.selectDateRange('All times');
            await compareVariantsPage.addVariant(options);
            await compareVariantsPage.addVariant(options);
            await compareVariantsPage.submitFilters();

            await expect(compareVariantsPage.diagramTitle('Prevalence Over Time')).toBeVisible();
            await compareVariantsPage.expectToSeeNoComponentErrors();
        });
    }
});
