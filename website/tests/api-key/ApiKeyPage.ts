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
        return this.page.getByTestId('generated-api-key');
    }

    public async getGeneratedKey(): Promise<string> {
        return this.generatedKey().innerText();
    }

    public doneButton() {
        return this.page.getByRole('button', { name: 'Done' });
    }
}
