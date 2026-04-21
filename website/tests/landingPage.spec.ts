import { expect } from '@playwright/test';

import { test } from './e2e.fixture.ts';
import { allOrganisms, organismConfig } from '../src/types/Organism.ts';

const organismsWithGenome = allOrganisms.filter((organism) => 'genome' in organismConfig[organism]);

test.describe('Organism landing pages', () => {
    for (const organism of organismsWithGenome) {
        test(`should render genome viewer for ${organism}`, async ({ landingPage }) => {
            await landingPage.goto(organism);

            await expect(landingPage.organismHeading(organism)).toBeVisible();
            await expect(landingPage.genomeViewerHeading).toBeVisible();
            await landingPage.expectToSeeNoComponentErrors();
        });
    }
});
