import { test as base } from '@playwright/test';

import { CompareVariantsPage } from './CompareVariantsPage.ts';
import { SequencingEffortsPage } from './SequencingEffortsPage.ts';

type E2EFixture = {
    compareVariantsPage: CompareVariantsPage;
    sequencingEffortsPage: SequencingEffortsPage;
};

export const test = base.extend<E2EFixture>({
    compareVariantsPage: async ({ page }, use) => {
        await use(new CompareVariantsPage(page));
    },
    sequencingEffortsPage: async ({ page }, use) => {
        await use(new SequencingEffortsPage(page));
    },
});
