import { expect } from '@playwright/test';

import { test } from '../e2e.fixture.ts';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
const USER_ID = 'e2e-test';
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

function getCollectionId(): number {
    if (collectionId === undefined) throw new Error('collectionId was not set in beforeAll');
    return collectionId;
}

test.beforeAll(async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/collections?userId=${USER_ID}`, {
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
    const response = await request.delete(`${BACKEND_URL}/collections/${collectionId}?userId=${USER_ID}`);
    expect(response.status()).toBe(204);
});

test.describe('New collection page', () => {
    test('shows "New collection" heading', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await expect(collectionFormPage.heading()).toHaveText('New collection');
    });

    test('"Use advanced query" checkbox is unticked by default', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await expect(collectionFormPage.advancedQueryCheckbox()).not.toBeChecked();
    });

    test('"Add variant" adds a variant row', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await expect(collectionFormPage.variantNameInputs()).toHaveCount(1);

        await collectionFormPage.addVariantButton().click();

        await expect(collectionFormPage.variantNameInputs()).toHaveCount(2);
    });

    test('Remove button is hidden when only one variant', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await expect(collectionFormPage.removeVariantButton()).not.toBeVisible();
    });

    test('Remove button appears after adding a second variant', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoCreate(ORGANISM);

        await collectionFormPage.addVariantButton().click();

        await expect(collectionFormPage.removeVariantButton().first()).toBeVisible();
    });
});

test.describe('Edit collection page', () => {
    test('shows "Edit collection" heading', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await expect(collectionFormPage.heading()).toHaveText('Edit collection');
    });

    test('pre-fills the collection name', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await expect(collectionFormPage.collectionNameInput()).toHaveValue(SEED_COLLECTION.name);
    });

    test('filterObject variant has "Use advanced query" unchecked', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        // First variant is filterObject
        await expect(collectionFormPage.advancedQueryCheckbox(0)).not.toBeChecked();
    });

    test('query variant has "Use advanced query" checked', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        // Second variant is query type
        await expect(collectionFormPage.advancedQueryCheckbox(1)).toBeChecked();
    });

    test('saving changes redirects to the detail page', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        const updatedName = 'Updated E2E Collection Name';
        await collectionFormPage.collectionNameInput().fill(updatedName);
        await collectionFormPage.submitButton('Save changes').click();

        await expect(collectionFormPage.page).toHaveURL(new RegExp(`/collections/${ORGANISM}/${getCollectionId()}$`));
        await expect(collectionFormPage.page.getByRole('heading', { name: updatedName })).toBeVisible();
    });

    test('"Delete collection" shows confirmation dialog; Cancel dismisses it', async ({ collectionFormPage }) => {
        await collectionFormPage.gotoEdit(ORGANISM, getCollectionId());

        await collectionFormPage.deleteCollectionButton().click();

        await expect(collectionFormPage.page.getByText('Are you sure')).toBeVisible();

        await collectionFormPage.cancelDeleteButton().click();

        await expect(collectionFormPage.page.getByText('Are you sure')).not.toBeVisible();
    });
});
