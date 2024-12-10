import { test as base } from '@playwright/test';

import { CompareVariantsPage } from './CompareVariantsPage.ts';

type E2EFixture = { compareVariantsPage: CompareVariantsPage };

export const test = base.extend<E2EFixture>({
    compareVariantsPage: async ({ page }, use) => {
        await use(new CompareVariantsPage(page));
    },
});
