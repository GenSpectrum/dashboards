# E2E Test Notes: New & Edit Collection Pages

## Conventions (from existing tests)

- Tests live in `tests/collections/`, specs import from `../e2e.fixture.ts`
- Page Object classes (e.g. `CollectionDetailPage`) encapsulate locators and navigation
- `test.beforeAll` creates backend state via `request.post(BACKEND_URL + ...)` with `?userId=e2e-test`
- `test.afterAll` cleans up via `request.delete`
- New page objects must be registered in `e2e.fixture.ts` (`E2EFixture` type + `base.extend`)

---

## Files to create

```
tests/collections/CollectionFormPage.ts       ← shared page object for create & edit
tests/collections/collectionForm.spec.ts      ← spec file
```

---

## Page Object: `CollectionFormPage`

```ts
import { type Page } from '@playwright/test';

export class CollectionFormPage {
    constructor(public readonly page: Page) {}

    async gotoCreate(organism: string) {
        await this.page.goto(`/collections/${organism}/create`);
    }

    async gotoEdit(organism: string, id: number) {
        await this.page.goto(`/collections/${organism}/${id}/edit`);
    }

    heading() {
        return this.page.getByRole('heading', { level: 1 });
    }

    nameInput() {
        return this.page.getByLabel('Name').first(); // first = collection-level name
    }

    descriptionInput() {
        return this.page.getByLabel('Description').first();
    }

    submitButton(label: string) {
        return this.page.getByRole('button', { name: label });
    }

    addVariantButton() {
        return this.page.getByRole('button', { name: 'Add variant' });
    }

    variantNameInput(index: number) {
        return this.page.getByLabel('Name').nth(index + 1); // 0 = collection name, so +1 for variants
    }

    removeVariantButton() {
        return this.page.getByRole('button', { name: 'Remove' });
    }

    advancedQueryCheckbox() {
        return this.page.getByRole('checkbox');
    }
}
```

---

## Spec: `collectionForm.spec.ts`

### Setup

```ts
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';
const USER_ID = 'e2e-test';
const ORGANISM = 'covid';
```

For edit tests, a collection needs to be seeded in `beforeAll` and deleted in `afterAll`,
same pattern as `collectionDetail.spec.ts`.

---

### `describe('New collection page')`

**"shows 'New collection' heading"**

- `goto /collections/covid/create`
- assert `heading()` has text `'New collection'`

**"redirects unauthenticated users"** _(if auth is enforced client-side, skip or mark as TODO)_

**"'Add variant' button adds a variant row"**

- goto create page
- count initial variant name inputs (expect 1)
- click `addVariantButton()`
- count variant name inputs (expect 2)

**"'Use advanced query instead' checkbox is unticked by default"**

- goto create page
- assert `advancedQueryCheckbox()` is not checked

**"'Remove' button is hidden when only one variant"**

- goto create page
- assert `removeVariantButton()` is not visible

**"'Remove' button appears after adding a second variant"**

- goto create page
- click add variant
- assert `removeVariantButton()` count is 2 (one per variant)

---

### `describe('Edit collection page')`

Seed a collection in `beforeAll`, delete in `afterAll`.

**"shows 'Edit collection' heading"**

- goto `/collections/covid/{id}/edit`
- assert `heading()` has text `'Edit collection'`

**"pre-fills name and description"**

- goto edit page
- assert `nameInput()` has value equal to the seeded collection name
- assert `descriptionInput()` has value equal to the seeded description

**"pre-fills existing variants"**

- assert variant name inputs contain the seeded variant names

**"'Use advanced query instead' reflects variant type"**

- for a `filterObject` variant: checkbox is unchecked
- for a `query` variant: checkbox is checked

**"saves changes and redirects to detail page"**

- update the name input
- click `submitButton('Save changes')`
- assert URL matches `/collections/covid/{id}` (the detail page)
- assert the updated name is visible

**"'Delete collection' button triggers confirmation"**

- click `Delete collection`
- assert confirmation text is visible (e.g. `Are you sure`)
- click `Cancel` to dismiss

---

## Registration in `e2e.fixture.ts`

Add to `E2EFixture`:

```ts
collectionFormPage: CollectionFormPage;
```

Add to `base.extend`:

```ts
collectionFormPage: async ({ page }, use) => {
    await use(new CollectionFormPage(page));
},
```
