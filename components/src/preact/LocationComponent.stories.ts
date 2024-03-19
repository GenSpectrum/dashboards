import { html } from 'lit';
import { Meta, StoryObj } from '@storybook/web-components';
import './LocationComponent';
import './LapisUrlContext';
import { LAPIS_URL } from '../constants';

const meta: Meta = {
    title: 'Component/Test',
    component: 'x-location-filter',
    parameters: { fetchMock: {} },
};

export default meta;

export const TestTEst: StoryObj = {
    render: () =>
        html` <gs-lapis-context value="${LAPIS_URL}">
            <gs-location-filter2 fields='["region", "country", "division", "location"]'></gs-location-filter2>
        </gs-lapis-context>`,
};
