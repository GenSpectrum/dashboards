import { type Page } from '@playwright/test';

export class ApiKeyPage {
    constructor(public readonly page: Page) {}

    public async goto() {
        await this.page.goto('/api-key');
    }

    public generateButton() {
        return this.page.getByRole('button', { name: 'Generate API key' });
    }

    public revokeButton() {
        return this.page.getByRole('button', { name: 'Revoke key' });
    }

    public generatedKey() {
        return this.page.locator('div.bg-gray-100 code');
    }

    public async getGeneratedKey(): Promise<string> {
        return this.generatedKey().innerText();
    }

    public doneButton() {
        return this.page.getByRole('button', { name: 'Done' });
    }
}
