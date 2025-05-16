import { describe, expect, it } from 'vitest';

import {
    getNumberRangeFromSearch,
    parseNumberRangeFilterFromUrl,
    setSearchFromNumberRange,
    setSearchFromNumberRangeFilters,
} from './numberRangeFilterFromToUrl';
import type { BaselineFilterConfig } from '../../components/pageStateSelectors/BaselineSelector.tsx';
import type { Dataset } from '../View.ts';

const numberRangeConfigs = [
    {
        type: 'number',
        lapisField: 'someNumberField',
        label: 'Some number field',
    },
    {
        type: 'number',
        lapisField: 'someOtherNumberField',
        label: 'Some other number field',
    },
    {
        type: 'text',
        lapisField: 'uninvolvedField',
    },
] satisfies BaselineFilterConfig[];

describe('parseNumberRangeFilterFromUrl', () => {
    it('should parse url to number range filter', () => {
        const search = new Map<string, string>([
            ['someNumberFieldFrom', '10'],
            ['someNumberFieldTo', '20'],
            ['notANumberFilter', 'notANumberFilter'],
        ]);

        const result = parseNumberRangeFilterFromUrl(search, numberRangeConfigs);

        expect(result).toStrictEqual({ someNumberField: { min: 10, max: 20 } });
    });

    it('should handle missing min or max value', () => {
        const search = new Map<string, string>([['someNumberFieldFrom', '10']]);

        const result = parseNumberRangeFilterFromUrl(search, numberRangeConfigs);

        expect(result).toStrictEqual({ someNumberField: { min: 10, max: undefined } });
    });

    it('should ignore non-numeric values', () => {
        const search = new Map<string, string>([
            ['someNumberFieldFrom', 'ten'],
            ['someNumberFieldTo', 'twenty'],
        ]);

        const result = parseNumberRangeFilterFromUrl(search, numberRangeConfigs);

        expect(result).toStrictEqual({});
    });
});

describe('setSearchFromNumberRangeFilters', () => {
    it('should set search from number range filter', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {},
                numberFilters: {
                    someNumberField: { min: 10, max: 20 },
                },
            },
        } satisfies Dataset;

        setSearchFromNumberRangeFilters(search, pageState, numberRangeConfigs);

        expect(search.get('someNumberFieldFrom')).toStrictEqual('10');
        expect(search.get('someNumberFieldTo')).toStrictEqual('20');
        expect(search.get('someOtherNumberFieldFrom')).toStrictEqual(null);
        expect(search.get('someOtherNumberFieldTo')).toStrictEqual(null);
    });

    it('should handle missing min or max value', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {},
                numberFilters: {
                    someNumberField: { min: 10 },
                },
            },
        } satisfies Dataset;

        setSearchFromNumberRangeFilters(search, pageState, numberRangeConfigs);

        expect(search.get('someNumberFieldFrom')).toStrictEqual('10');
        expect(search.get('someNumberFieldTo')).toStrictEqual(null);
    });

    it('should get input after a round trip over the url params', () => {
        const search = new URLSearchParams();
        const pageState = {
            datasetFilter: {
                locationFilters: {},
                textFilters: {},
                dateFilters: {},
                numberFilters: {
                    someNumberField: { min: 10, max: 20 },
                },
            },
        } satisfies Dataset;

        setSearchFromNumberRangeFilters(search, pageState, numberRangeConfigs);
        const result = parseNumberRangeFilterFromUrl(search, numberRangeConfigs);

        expect(result).toStrictEqual({
            someNumberField: { min: 10, max: 20 },
        });
    });
});

describe('getNumberRangeFromSearch', () => {
    it('should return undefined, when field is not in search param', () => {
        const search = new Map<string, string>([
            ['someLapisFieldFrom', '2'],
            ['someLapisFieldTo', '3'],
        ]);

        const result = getNumberRangeFromSearch(search, 'someOtherLapisField');

        expect(result).to.be.equal(undefined);
    });

    it('should extract number range from url', () => {
        const search = new Map<string, string>([
            ['someLapisFieldFrom', '2.1'],
            ['someLapisFieldTo', '3'],
        ]);

        const result = getNumberRangeFromSearch(search, 'someLapisField');

        expect(result).to.deep.equal({ min: 2.1, max: 3 });
    });

    it('should extract min from url, when only min is provided', () => {
        const search = new Map<string, string>([['someLapisFieldFrom', '2']]);

        const result = getNumberRangeFromSearch(search, 'someLapisField');

        expect(result).to.deep.equal({ min: 2, max: undefined });
    });

    it('should extract max from url, when only max is provided', () => {
        const search = new Map<string, string>([['someLapisFieldTo', '3']]);

        const result = getNumberRangeFromSearch(search, 'someLapisField');

        expect(result).to.deep.equal({ min: undefined, max: 3 });
    });

    it('should extract only max from url, when min is not a number', () => {
        const search = new Map<string, string>([
            ['someLapisFieldTo', '3'],
            ['someLapisFieldFrom', 'notANumber'],
        ]);

        const result = getNumberRangeFromSearch(search, 'someLapisField');

        expect(result).to.deep.equal({ min: undefined, max: 3 });
    });

    it('should not parse values, that are not numbers', () => {
        const search = new Map<string, string>([['someLapisFieldFrom', 'notANumber']]);

        const result = getNumberRangeFromSearch(search, 'someLapisField');

        expect(result).to.deep.equal(undefined);
    });
});

describe('setSearchFromNumberRange', () => {
    it('should set search from number range', () => {
        const numberRange = { min: 2.1, max: 3 };

        const search = new URLSearchParams();

        setSearchFromNumberRange(search, 'someLapisField', numberRange);

        expect(search.get('someLapisFieldFrom')).toEqual('2.1');
        expect(search.get('someLapisFieldTo')).toEqual('3');
    });

    it('should set search with min, when min is defined but max is not', () => {
        const numberRange = { min: 2.1 };

        const search = new URLSearchParams();

        setSearchFromNumberRange(search, 'someLapisField', numberRange);

        expect(search.get('someLapisFieldFrom')).toEqual('2.1');
        expect(search.get('someLapisFieldTo')).toEqual(null);
    });

    it('should set search with max, when max is defined but min is not', () => {
        const numberRange = { max: 3 };

        const search = new URLSearchParams();

        setSearchFromNumberRange(search, 'someLapisField', numberRange);

        expect(search.get('someLapisFieldFrom')).toEqual(null);
        expect(search.get('someLapisFieldTo')).toEqual('3');
    });
});
