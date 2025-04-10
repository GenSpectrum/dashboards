import { describe, expect, it } from 'vitest';

import { parseLocationFiltersFromUrl, setSearchFromLocationFilters } from './PageStateHandler.ts';
import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';

describe('parseLocationFilterFromUrl', () => {
    it('should parse location to filter', () => {
        const configs = [
            {
                type: 'location',
                placeholderText: 'Some location',
                label: 'Some location',
                locationFields: ['country', 'region'],
            },
        ] satisfies BaselineFilterConfig[];

        const search = new Map<string, string>([
            ['country', 'someCountry'],
            ['notALocationFilter', 'notALocationFilter'],
        ]);

        const result = parseLocationFiltersFromUrl(search, configs);

        expect(result['country,region']).toEqual({ country: 'someCountry' });
    });

    it('should parse one location to multiple filters', () => {
        const configs = [
            {
                type: 'location',
                placeholderText: 'Some location',
                label: 'Some location',
                locationFields: ['country', 'region'],
            },
            {
                type: 'location',
                placeholderText: 'Some other location',
                label: 'Some other location',
                locationFields: ['country', 'someOtherRegion'],
            },
        ] satisfies BaselineFilterConfig[];

        const search = new Map<string, string>([
            ['country', 'someCountry'],
            ['notALocationFilter', 'notALocationFilter'],
        ]);

        const result = parseLocationFiltersFromUrl(search, configs);

        expect(result['country,region']).toEqual({ country: 'someCountry' });
        expect(result['country,someOtherRegion']).toEqual({ country: 'someCountry' });
    });
});

describe('setSearchFromLocationFilters', () => {
    it('should set search from one filter', () => {
        const search = new URLSearchParams();

        const pageState = {
            datasetFilter: {
                locationFilters: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'country,region': { country: 'someCountry' },
                },
                textFilters: {},
                dateFilters: {},
            },
        } satisfies Dataset;

        const configs = [
            {
                type: 'location',
                placeholderText: 'Some location',
                label: 'Some location',
                locationFields: ['country', 'region'],
            },
        ] satisfies BaselineFilterConfig[];

        setSearchFromLocationFilters(search, pageState, configs);

        expect(search.get('country')).toEqual('someCountry');
        expect(search.keys().toArray().length).toEqual(1);
    });

    it('should set search from multiple filters', () => {
        const search = new URLSearchParams();

        const pageState = {
            datasetFilter: {
                locationFilters: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'country,region': { country: 'someCountry' },
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'someOtherCountry,someOtherRegion': { someOtherCountry: 'someOtherCountry' },
                },
                textFilters: {},
                dateFilters: {},
            },
        } satisfies Dataset;

        const configs = [
            {
                type: 'location',
                placeholderText: 'Some location',
                label: 'Some location',
                locationFields: ['country', 'region'],
            },
            {
                type: 'location',
                placeholderText: 'Some other location',
                label: 'Some other location',
                locationFields: ['someOtherCountry', 'someOtherRegion'],
            },
        ] satisfies BaselineFilterConfig[];

        setSearchFromLocationFilters(search, pageState, configs);

        expect(search.get('country')).toEqual('someCountry');
        expect(search.get('someOtherCountry')).toEqual('someOtherCountry');
        expect(search.keys().toArray().length).toEqual(2);
    });

    it('should set search with two filters with the same field and use the first', () => {
        const search = new URLSearchParams();

        const pageState = {
            datasetFilter: {
                locationFilters: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'country,region': { country: 'someCountry' },
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'country,someOtherRegion': { country: 'someOtherRegion' },
                },
                textFilters: {},
                dateFilters: {},
            },
        } satisfies Dataset;

        const configs = [
            {
                type: 'location',
                placeholderText: 'Some location',
                label: 'Some location',
                locationFields: ['country', 'region'],
            },
            {
                type: 'location',
                placeholderText: 'Some other location',
                label: 'Some other location',
                locationFields: ['someOtherCountry', 'someOtherRegion'],
            },
        ] satisfies BaselineFilterConfig[];

        setSearchFromLocationFilters(search, pageState, configs);

        expect(search.get('country')).toEqual('someCountry');
        expect(search.keys().toArray().length).toEqual(1);
    });
});
