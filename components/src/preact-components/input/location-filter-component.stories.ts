import type { Meta, StoryObj } from '@storybook/web-components';
import { withActions } from '@storybook/addon-actions/decorator';
import { AGGREGATED_ENDPOINT, LAPIS_URL } from '../../constants';

import { html } from 'lit';
import '../../components/app';
import '../../preact-components/input/location-filter-component';
import data from '../../preact/locationFilter/__mockData__/aggregated.json';
import { withinShadowRoot } from '../../storybook/withinShadowRoot.story';
import { expect, fn, userEvent, waitFor } from '@storybook/test';

const meta: Meta<{}> = {
    title: 'Input/Location filter',
    component: 'gs-location-filter',
    parameters: {
        actions: {
            handles: ['gs-location-changed'],
        },
    },
    decorators: [withActions],
};

export default meta;

const Template: StoryObj<{ fields: string[] }> = {
    render: (args) => {
        return html` <gs-app lapis="${LAPIS_URL}">
            <div class="max-w-screen-lg">
                <gs-location-filter .fields=${args.fields}></gs-location-filter>
            </div>
        </gs-app>`;
    },
    args: {
        fields: ['region', 'country', 'division', 'location'],
    },
};

const aggregatedEndpointMatcher = {
    name: 'numeratorEG',
    url: AGGREGATED_ENDPOINT,
    query: {
        fields: 'region,country,division,location',
    },
};

export const LocationFilter: StoryObj<{ fields: string[] }> = {
    ...Template,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: aggregatedEndpointMatcher,
                    response: {
                        status: 200,
                        body: data,
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-location-filter');
        await waitFor(() => {
            return expect(canvas.getByRole('combobox')).toBeEnabled();
        });
    },
};

export const DelayToShowLoadingState: StoryObj<{ fields: string[] }> = {
    ...Template,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: aggregatedEndpointMatcher,
                    response: {
                        status: 200,
                        body: data,
                    },
                    options: {
                        delay: 5000,
                    },
                },
            ],
        },
    },
};

export const FetchingLocationsFails: StoryObj<{ fields: string[] }> = {
    ...Template,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: aggregatedEndpointMatcher,
                    response: {
                        status: 500,
                        body: { error: 'no data' },
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-location-filter');

        await waitFor(() => expect(canvas.getByText('Error: TypeError', { exact: false })).toBeInTheDocument());
    },
};

export const FiresEvent: StoryObj<{ fields: string[] }> = {
    ...Template,
    parameters: {
        fetchMock: {
            mocks: [
                {
                    matcher: aggregatedEndpointMatcher,
                    response: {
                        status: 200,
                        body: data,
                    },
                },
            ],
        },
    },
    play: async ({ canvasElement, step }) => {
        const canvas = await withinShadowRoot(canvasElement, 'gs-location-filter');

        const submitButton = () => canvas.getByRole('button', { name: 'Submit' });
        const inputField = () => canvas.getByRole('combobox');

        const listenerMock = fn();
        await step('Setup event listener mock', async () => {
            canvasElement.addEventListener('gs-location-changed', listenerMock);
        });

        await step('wait until data is loaded', async () => {
            await waitFor(() => {
                return expect(inputField()).toBeEnabled();
            });
        });

        await step('Input invalid location', async () => {
            await userEvent.type(inputField(), 'Not / A / Location');
            await userEvent.click(submitButton());
            await expect(listenerMock).not.toHaveBeenCalled();
            await userEvent.type(inputField(), '{backspace>18/}');
        });

        await step('Select Asia', async () => {
            await userEvent.type(inputField(), 'Asia');
            await userEvent.click(submitButton());
            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        region: 'Asia',
                    },
                }),
            );
        });

        await step('Select Asia / Bangladesh / Rajshahi / Chapainawabgonj', async () => {
            await userEvent.type(inputField(), ' / Bangladesh / Rajshahi / Chapainawabgonj');
            await userEvent.click(submitButton());
            await expect(listenerMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: {
                        region: 'Asia',
                        country: 'Bangladesh',
                        division: 'Rajshahi',
                        location: 'Chapainawabgonj',
                    },
                }),
            );
        });
    },
};
