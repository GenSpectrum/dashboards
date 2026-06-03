import { test as base, type Page } from '@playwright/test';

import { CompareSideBySidePage } from './CompareSideBySidePage.ts';
import { CompareToBaselinePage } from './CompareToBaselinePage.ts';
import { CompareVariantsPage } from './CompareVariantsPage.ts';
import { LandingPage } from './LandingPage.ts';
import { SequencingEffortsPage } from './SequencingEffortsPage.ts';
import { SingleVariantPage } from './SingleVariantPage.ts';
import { WasapPage } from './WasapPage.ts';
import { ApiKeyPage } from './api-key/ApiKeyPage.ts';
import { CollectionDetailPage } from './collections/CollectionDetailPage.ts';
import { CollectionFormPage } from './collections/CollectionFormPage.ts';
import { E2E_GITHUB_ID, setupAuthCookie } from './helpers/auth.ts';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

type E2EFixture = {
    compareVariantsPage: CompareVariantsPage;
    sequencingEffortsPage: SequencingEffortsPage;
    compareToBaselinePage: CompareToBaselinePage;
    compareSideBySidePage: CompareSideBySidePage;
    singleVariantPage: SingleVariantPage;
    landingPage: LandingPage;
    wasapPage: WasapPage;
    collectionDetailPage: CollectionDetailPage;
    collectionFormPage: CollectionFormPage;
    authenticatedPage: Page;
    authenticatedCollectionFormPage: CollectionFormPage;
    authenticatedApiKeyPage: ApiKeyPage;
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
    wasapPage: async ({ page }, use) => {
        await use(new WasapPage(page));
    },
    collectionDetailPage: async ({ page }, use) => {
        await use(new CollectionDetailPage(page));
    },
    collectionFormPage: async ({ page }, use) => {
        await use(new CollectionFormPage(page));
    },
    authenticatedPage: async ({ page, request }, use) => {
        const syncResponse = await request.post(`${BACKEND_URL}/users/sync`, {
            data: { githubId: E2E_GITHUB_ID, name: 'e2e-test', email: null },
        });
        const { id: gsUserId } = (await syncResponse.json()) as { id: number };
        await setupAuthCookie(page, 'e2e-test', gsUserId);
        await use(page);
    },
    authenticatedCollectionFormPage: async ({ authenticatedPage }, use) => {
        await use(new CollectionFormPage(authenticatedPage));
    },
    authenticatedApiKeyPage: async ({ authenticatedPage }, use) => {
        await use(new ApiKeyPage(authenticatedPage));
    },
});
