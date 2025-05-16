import { describe, expect, it } from 'vitest';

import { parseTextFiltersFromUrl, setSearchFromTextFilters } from './textFilterFromToUrl.ts';
import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';

const configs = [
    {
        type: 'text',
        lapisField: 'someTextField',
        placeholderText: 'Some text field',
        label: 'Some text field',
    },
    {
        type: 'text',
        lapisField: 'someOtherTextField',
        placeholderText: 'Some other text field',
        label: 'Some other text field',
    },
] satisfies BaselineFilterConfig[];

describe('parseTextFiltersFromUrl', () => {
    it('should parse url to text filter', () => {
        const search = new Map<string, string>([
            ['someTextField', 'someTextFieldValue'],
            ['notATextFilter', 'notATextFilter'],
        ]);

        const result = parseTextFiltersFromUrl(search, configs);

        expect(result).toStrictEqual({ someTextField: 'someTextFieldValue' });
    });
});

describe('setSearchFromTextFilters', () => {
    it('should set search from text filter', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {
                    someTextField: 'someTextFieldValue',
                },
                dateFilters: {},
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromTextFilters(search, pageState, configs);

        expect(search.get('someTextField')).toStrictEqual('someTextFieldValue');
        expect(search.get('someOtherTextField')).toStrictEqual(null);
    });

    it('should get input after a round trip over the url params', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {
                    someTextField: 'someTextFieldValue',
                },
                dateFilters: {},
                numberFilters: {},
            },
        } satisfies Dataset;

        setSearchFromTextFilters(search, pageState, configs);

        const result = parseTextFiltersFromUrl(search, configs);

        expect(result).toStrictEqual({
            someTextField: 'someTextFieldValue',
        });
    });
});
