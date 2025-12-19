import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import { LapisUnreachableWrapperClient } from './LapisUnreachableWrapperClient';
import { DUMMY_LAPIS_URL } from '../../routeMocker';
import { it } from '../../test-extend';

const queryClient = new QueryClient();

describe('LapisUnreachableWrapperClient', () => {
    it('displays children when LAPIS is reachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [{ count: 100 }] });

        const content = 'Content is visible';

        const { getByText } = renderWithContent(content);

        await expect.element(getByText(content)).toBeVisible();
    });

    it('displays error message when LAPIS is unreachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByText } = renderWithContent('Content is visible');

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
        await expect.element(getByText('Unable to connect to the data source')).toBeVisible();
    });

    it('does not display children when LAPIS is unreachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const content = 'Content is visible';

        const { getByText } = renderWithContent(content);

        await expect.poll(() => getByText(content).query()).not.toBeInTheDocument();
    });

    it('displays error when LAPIS returns invalid response', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [] }, 200);

        const { getByText } = renderWithContent('Content is visible');

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
    });

    it('displays error when LAPIS returns 500', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [{ count: 100 }] }, 500);

        const { getByText } = renderWithContent('Content is visible');

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
    });
});

function renderWithContent(content: string) {
    return render(
        <QueryClientProvider client={queryClient}>
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>{content}</div>
            </LapisUnreachableWrapperClient>
        </QueryClientProvider>,
    );
}
