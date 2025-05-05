import { describe, expect, it } from 'vitest';

import { getNumberRangeFromSearch, setSearchFromNumberRange } from './helpers.ts';

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

    it('should extract max from url, when only min is provided', () => {
        const search = new Map<string, string>([['someLapisFieldTo', '3']]);

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
