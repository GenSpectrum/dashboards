import { describe, expect } from 'vitest';
import { render } from 'vitest-browser-react';

import LapisUnreachableWrapperClient from './LapisUnreachableWrapperClient';
import { DUMMY_LAPIS_URL } from '../../routeMocker';
import { it } from '../../test-extend';

describe('LapisUnreachableWrapperClient', () => {
    it('displays children when LAPIS is reachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [{ count: 100 }] });

        const { getByText } = render(
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>Content is visible</div>
            </LapisUnreachableWrapperClient>,
        );

        await expect.element(getByText('Content is visible')).toBeVisible();
    });

    it('displays error message when LAPIS is unreachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByText } = render(
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>Content is visible</div>
            </LapisUnreachableWrapperClient>,
        );

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
        await expect.element(getByText('Unable to connect to the data source')).toBeVisible();
    });

    it('does not display children when LAPIS is unreachable', async ({ routeMockers: { lapis } }) => {
        lapis.mockLapisDown();

        const { getByText } = render(
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>Content should not be visible</div>
            </LapisUnreachableWrapperClient>,
        );

        await expect.poll(() => getByText('Content should not be visible').query()).not.toBeInTheDocument();
    });

    it('displays error when LAPIS returns invalid response', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [] }, 200);

        const { getByText } = render(
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>Content is visible</div>
            </LapisUnreachableWrapperClient>,
        );

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
    });

    it('displays error when LAPIS returns 500', async ({ routeMockers: { lapis } }) => {
        lapis.mockPostAggregated({}, { data: [{ count: 100 }] }, 500);

        const { getByText } = render(
            <LapisUnreachableWrapperClient lapisUrl={DUMMY_LAPIS_URL}>
                <div>Content is visible</div>
            </LapisUnreachableWrapperClient>,
        );

        await expect.element(getByText('Data Source Unreachable')).toBeVisible();
    });
});
