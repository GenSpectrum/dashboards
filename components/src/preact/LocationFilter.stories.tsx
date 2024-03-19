import { LocationFilter, LocationFilterProps } from './LocationFilter';
import { LapisUrlContext } from './LapisUrlContext';
import { LAPIS_URL } from '../constants';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';

export default {
    title: 'Example/LocationFilter',
    component: LocationFilter,
    tags: ['autodocs'],
    parameters: {
        fetchMock: {},
        actions: {
            handles: ['gs-location-changed'],
        },
    },
    argTypes: {
        // backgroundColor: { control: 'color' },
        // onClick: { action: 'onClick' },
    },
    args: { fields: ['region', 'country', 'division', 'location'] },
};

export const Primary = {
    render: (args: LocationFilterProps) => (
        <LapisUrlContext.Provider value={LAPIS_URL}>
            <LocationFilter fields={args.fields} />
        </LapisUrlContext.Provider>
    ),
    play: async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);

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
