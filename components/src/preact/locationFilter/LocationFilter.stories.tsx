import { LocationFilter, LocationFilterProps } from './LocationFilter';
import { LapisUrlContext } from '../LapisUrlContext';
import { LAPIS_URL } from '../../constants';

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
};
