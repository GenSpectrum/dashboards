import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';
import { E2E_GITHUB_ID, setupAuthCookie } from '../helpers/auth.ts';
import { createCollection, deleteCollection, syncUser } from '../helpers/backendClient.ts';

const ORGANISM = 'covid';

const SEED_COLLECTION = {
    name: 'E2E Form Test Collection',
    organism: ORGANISM,
    description: 'Created by E2E tests — safe to delete',
    variants: [
        {
            type: 'filterObject',
            name: 'JN.1*',
            description: 'JN.1 lineage',
            filterObject: { nextcladePangoLineage: 'JN.1*' },
        },
        {
            type: 'query',
            name: 'Switzerland',
            description: 'Sequences from Switzerland',
            countQuery: "country = 'Switzerland'",
        },
    ],
};

let collectionId: number | undefined;
let userId: number;

function getCollectionId(): number {
    if (collectionId === undefined) throw new Error('collectionId was not set in beforeAll');
    return collectionId;
}

test.beforeAll(async ({ request }) => {
    userId = await syncUser(request, E2E_GITHUB_ID);
    collectionId = await createCollection(request, userId, SEED_COLLECTION);
});

test.afterAll(async ({ request }) => {
    if (collectionId === undefined) {
        return;
    }
    await deleteCollection(request, collectionId, userId);
});

test.describe('New collection page', () => {
    test('shows "Please login" when not authenticated', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await expect(collectionFormPage.page.getByRole('heading', { name: 'Please login' })).toBeVisible();
    });

    test('shows "New collection" heading', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await expect(authenticatedCollectionFormPage.heading()).toHaveText('New collection');
    });

    test('"Use advanced query" checkbox is unticked by default', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await expect(authenticatedCollectionFormPage.advancedQueryCheckbox()).not.toBeChecked();
    });

    test('"Add variant" adds a variant row', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await expect(authenticatedCollectionFormPage.variantNameInputs()).toHaveCount(1);

        await authenticatedCollectionFormPage.addVariantButton().click();

        await expect(authenticatedCollectionFormPage.variantNameInputs()).toHaveCount(2);
    });

    test('Remove button is hidden when only one variant', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await expect(authenticatedCollectionFormPage.removeVariantButton()).not.toBeVisible();
    });

    test('Remove button appears after adding a second variant', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await authenticatedCollectionFormPage.addVariantButton().click();

        await expect(authenticatedCollectionFormPage.removeVariantButton().first()).toBeVisible();
    });

    test('creating a collection redirects to its detail page', async ({ authenticatedCollectionFormPage, request }) => {
        await authenticatedCollectionFormPage.gotoCreate(ORGANISM);

        await authenticatedCollectionFormPage.collectionNameInput().fill('E2E Create Redirect Test');
        await authenticatedCollectionFormPage.submitButton('Create collection').click();

        await expect(authenticatedCollectionFormPage.page).toHaveURL(new RegExp(`/collections/${ORGANISM}/\\d+$`));

        const url = authenticatedCollectionFormPage.page.url();
        const id = /\/collections\/\w+\/(\d+)$/.exec(url)?.[1];
        if (id !== undefined) {
            await deleteCollection(request, Number(id), userId);
        }
    });
});

test.describe('Edit collection page', () => {
    test('shows "Edit collection" heading', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await expect(authenticatedCollectionFormPage.heading()).toHaveText('Edit collection');
    });

    test('pre-fills the collection name', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await expect(authenticatedCollectionFormPage.collectionNameInput()).toHaveValue(SEED_COLLECTION.name);
    });

    test('filterObject variant has "Use advanced query" unchecked', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        // First variant is filterObject
        await expect(authenticatedCollectionFormPage.advancedQueryCheckbox(0)).not.toBeChecked();
    });

    test('query variant has "Use advanced query" checked', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        // Second variant is query type
        await expect(authenticatedCollectionFormPage.advancedQueryCheckbox(1)).toBeChecked();
    });

    test('saving changes redirects to the detail page', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        const updatedName = 'Updated E2E Collection Name';
        await authenticatedCollectionFormPage.collectionNameInput().fill(updatedName);
        await authenticatedCollectionFormPage.submitButton('Save changes').click();

        await expect(authenticatedCollectionFormPage.page).toHaveURL(
            new RegExp(`/collections/${ORGANISM}/${getCollectionId()}$`),
        );
        await expect(authenticatedCollectionFormPage.page.getByRole('heading', { name: updatedName })).toBeVisible();
    });

    test('clearing the description and saving removes it', async ({ authenticatedCollectionFormPage }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await authenticatedCollectionFormPage.collectionDescriptionTextarea().clear();
        await authenticatedCollectionFormPage.submitButton('Save changes').click();
        await authenticatedCollectionFormPage.page.waitForURL(
            new RegExp(`/collections/${ORGANISM}/${getCollectionId()}$`),
        );

        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await expect(authenticatedCollectionFormPage.collectionDescriptionTextarea()).toHaveValue('');
    });

    test('shows "Not authorized" with 403 when editing a collection owned by another user', async ({
        page,
        request,
    }) => {
        const otherUserId = await syncUser(request, 'e2e-other-99999');
        await setupAuthCookie(page, 'e2e-other', otherUserId);

        const response = await page.goto(`/collections/${ORGANISM}/${getCollectionId()}/edit`);

        expect(response?.status()).toBe(403);
        await expect(page.getByRole('heading', { name: 'Not authorized' })).toBeVisible();
    });

    test('"Delete collection" shows confirmation dialog; Cancel dismisses it', async ({
        authenticatedCollectionFormPage,
    }) => {
        await authenticatedCollectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await authenticatedCollectionFormPage.deleteCollectionButton().click();

        await expect(authenticatedCollectionFormPage.page.getByText('Are you sure')).toBeVisible();

        await authenticatedCollectionFormPage.cancelDeleteButton().click();

        await expect(authenticatedCollectionFormPage.page.getByText('Are you sure')).not.toBeVisible();
    });
});
