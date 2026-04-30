import { test as base, type Page } from '@playwright/test';

import { CompareSideBySidePage } from './CompareSideBySidePage.ts';
import { CompareToBaselinePage } from './CompareToBaselinePage.ts';
import { CompareVariantsPage } from './CompareVariantsPage.ts';
import { LandingPage } from './LandingPage.ts';
import { SequencingEffortsPage } from './SequencingEffortsPage.ts';
import { SingleVariantPage } from './SingleVariantPage.ts';
import { CollectionDetailPage } from './collections/CollectionDetailPage.ts';
import { CollectionFormPage } from './collections/CollectionFormPage.ts';
import { setupAuthCookie } from './helpers/auth.ts';

type E2EFixture = {
    compareVariantsPage: CompareVariantsPage;
    sequencingEffortsPage: SequencingEffortsPage;
    compareToBaselinePage: CompareToBaselinePage;
    compareSideBySidePage: CompareSideBySidePage;
    singleVariantPage: SingleVariantPage;
    landingPage: LandingPage;
    collectionDetailPage: CollectionDetailPage;
    collectionFormPage: CollectionFormPage;
    authenticatedPage: Page;
    authenticatedCollectionFormPage: CollectionFormPage;
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
    singleVariantPage: async ({ page }, use) => {
        await use(new SingleVariantPage(page));
    },
    landingPage: async ({ page }, use) => {
        await use(new LandingPage(page));
    },
    collectionDetailPage: async ({ page }, use) => {
        await use(new CollectionDetailPage(page));
    },
    collectionFormPage: async ({ page }, use) => {
        await use(new CollectionFormPage(page));
    },
    authenticatedPage: async ({ page }, use) => {
        await setupAuthCookie(page, 'e2e-test');
        await use(page);
    },
    authenticatedCollectionFormPage: async ({ authenticatedPage }, use) => {
        await use(new CollectionFormPage(authenticatedPage));
    },
});
