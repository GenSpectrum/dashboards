import { type Page } from '@playwright/test';

export class ApiKeyPage {
    constructor(public readonly page: Page) {}

    public async goto() {
        await this.page.goto('/api-keys');
    }

    public generateButton() {
        return this.page.getByRole('button', { name: 'Generate API key' });
    }

    public revokeButton() {
        return this.page.getByRole('button', { name: 'Revoke key' });
    }

    public modal() {
        return this.page.getByRole('dialog', { name: 'Your new API key' });
    }

    public async getGeneratedKey(): Promise<string> {
        return this.modal().locator('code').innerText();
    }

    public doneButton() {
        return this.page.getByRole('button', { name: 'Done' });
    }
}
