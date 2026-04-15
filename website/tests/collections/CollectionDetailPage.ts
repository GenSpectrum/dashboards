import { type Page } from '@playwright/test';

export class CollectionDetailPage {
    public readonly table;

    constructor(public readonly page: Page) {
        this.table = this.page.getByRole('table');
    }

    public async goto(organism: string, collectionId: number) {
        await this.page.goto(`/collections/${organism}/${collectionId}`);
    }

    public heading(name: string) {
        return this.page.getByRole('heading', { name });
    }

    public idText(collectionId: number) {
        return this.page.getByText(`#${collectionId}`);
    }

    public metadataText(organismLabel: string) {
        return this.page.getByText(new RegExp(`${organismLabel}.*collection.*owned by`, 'i'));
    }

    public tableColumnHeader(name: string) {
        return this.table.getByRole('columnheader', { name });
    }

    public tableCell(name: string, options?: { exact?: boolean }) {
        return this.table.getByRole('cell', { name, ...options });
    }

    public variantLink(name: string) {
        return this.page.getByRole('link', { name });
    }
}
