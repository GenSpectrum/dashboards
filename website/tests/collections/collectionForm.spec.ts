import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';
import { E2E_GITHUB_ID } from '../helpers/auth.ts';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
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
    const syncResponse = await request.post(`${BACKEND_URL}/users/sync`, {
        data: { githubId: E2E_GITHUB_ID, name: 'e2e-test', email: null },
    });
    expect(syncResponse.status()).toBe(200);
    const userBody = (await syncResponse.json()) as { id: number };
    userId = userBody.id;

    const response = await request.post(`${BACKEND_URL}/collections?userId=${userId}`, {
        data: SEED_COLLECTION,
    });
    expect(response.status()).toBe(201);
    const body = (await response.json()) as { id: number };
    collectionId = body.id;
});

test.afterAll(async ({ request }) => {
    if (collectionId === undefined) {
        return;
    }
    const response = await request.delete(`${BACKEND_URL}/collections/${collectionId}?userId=${userId}`);
    expect(response.status()).toBe(204);
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
            await request.delete(`${BACKEND_URL}/collections/${id}?userId=${userId}`);
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
