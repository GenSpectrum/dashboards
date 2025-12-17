import { test as base } from '@playwright/test';

import { CompareSideBySidePage } from './CompareSideBySidePage.ts';
import { CompareToBaselinePage } from './CompareToBaselinePage.ts';
import { CompareVariantsPage } from './CompareVariantsPage.ts';
import { SequencingEffortsPage } from './SequencingEffortsPage.ts';

type E2EFixture = {
    compareVariantsPage: CompareVariantsPage;
    sequencingEffortsPage: SequencingEffortsPage;
    compareToBaselinePage: CompareToBaselinePage;
    compareSideBySidePage: CompareSideBySidePage;
};

export const test = base.extend<E2EFixture>({
    compareVariantsPage: async ({ page }, use) => {
        await use(new CompareVariantsPage(page));
    },
    sequencingEffortsPage: async ({ page }, use) => {
        await use(new SequencingEffortsPage(page));
    },
    compareToBaselinePage: async ({ page }, use) => {
        await use(new CompareToBaselinePage(page));
    },
    compareSideBySidePage: async ({ page }, use) => {
        await use(new CompareSideBySidePage(page));
    },
});
