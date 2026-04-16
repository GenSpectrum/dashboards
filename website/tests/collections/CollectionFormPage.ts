import { type Page } from '@playwright/test';

export class CollectionFormPage {
    constructor(public readonly page: Page) {}

    public async gotoCreate(organism: string) {
        await this.page.goto(`/collections/${organism}/create`);
    }

    public async gotoEdit(organism: string, id: number) {
        await this.page.goto(`/collections/${organism}/${id}/edit`);
    }

    public heading() {
        return this.page.getByRole('heading', { level: 1 });
    }

    public collectionNameInput() {
        return this.page.getByPlaceholder('A name to identify this collection.');
    }

    public submitButton(label: string) {
        return this.page.getByRole('button', { name: label });
    }

    public addVariantButton() {
        return this.page.getByRole('button', { name: 'Add variant' });
    }

    public variantNameInputs() {
        return this.page.getByPlaceholder('Variant name');
    }

    public advancedQueryCheckbox(index = 0) {
        return this.page.getByRole('checkbox').nth(index);
    }

    public removeVariantButton() {
        return this.page.getByRole('button', { name: 'Remove' });
    }

    public deleteCollectionButton() {
        return this.page.getByRole('button', { name: 'Delete collection' });
    }

    public cancelDeleteButton() {
        return this.page.getByRole('button', { name: 'Cancel' });
    }
}
