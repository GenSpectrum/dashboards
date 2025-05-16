import { describe, it, expect } from 'vitest';

import {
    decodeFiltersFromSearch,
    encodeMultipleFiltersToUrlSearchParam,
    searchParamsFromFilterMap,
} from './multipleFiltersFromToUrl.ts';

describe('decodeFiltersFromSearch', () => {
    it('should decode filters from search', () => {
        const search = new URLSearchParams();
        search.append('columns', '2');
        search.append('key1$0', 'value1');
        search.append('key2$0', 'value2');
        search.append('key3$1', 'value3');

        const result = decodeFiltersFromSearch(search);

        expect(result.size).toBe(2);
        expect(result.get(0)?.get('key1')).toBe('value1');
        expect(result.get(0)?.get('key2')).toBe('value2');
        expect(result.get(1)?.get('key3')).toBe('value3');
    });

    it('should only decode if columns parameter is set', () => {
        const search = new URLSearchParams();
        search.append('key1$0', 'value1');

        const result = decodeFiltersFromSearch(search);

        expect(result.size).toBe(0);
    });

    it('should handle invalid column id', () => {
        const search = new URLSearchParams();
        search.append('columns', '1');
        search.append('key1$notAValidId', 'value1');

        const result = decodeFiltersFromSearch(search);

        expect(result.size).toBe(1);
        expect(result.get(0)?.size).toBe(0);
    });

    it('should ignore column ids larger than the column parameter', () => {
        const search = new URLSearchParams();
        search.append('columns', '1');
        search.append('key1$2', 'value1');

        const result = decodeFiltersFromSearch(search);

        expect(result.size).toBe(1);
        expect(result.get(0)?.size).toBe(0);
    });
});

describe('encodeMultipleFiltersToUrlSearchParam', () => {
    it('should encode filters to url search param', () => {
        const filters = new Map([
            [
                0,
                new Map([
                    ['key1', 'value1'],
                    ['key2', 'value2'],
                ]),
            ],
            [1, new Map([['key3', 'value3']])],
        ]);

        const result = encodeMultipleFiltersToUrlSearchParam(filters);

        expect(result.get('columns')).toBe('2');
        expect(result.get('key1$0')).toBe('value1');
        expect(result.get('key2$0')).toBe('value2');
        expect(result.get('key3$1')).toBe('value3');
    });

    it('should handle empty filters', () => {
        const filters = new Map();

        const result = encodeMultipleFiltersToUrlSearchParam(filters);

        expect(result.get('columns')).toBeNull();
    });
});

describe('searchParamsFromFilterMap', () => {
    it('should convert filter map to search params', () => {
        const filterMap = new Map<number, Record<string, string>>([
            [0, { key1: 'value1', key2: 'value2' }],
            [1, { key1: 'value3' }],
        ]);

        const mapEntryToSearchParams = (search: URLSearchParams, entry: Record<string, string>) => {
            // applies some function to the entry. This case just use key1 and ignore all others
            search.append('key1', entry.key1);
        };

        const result = searchParamsFromFilterMap(filterMap, mapEntryToSearchParams);

        expect(result.get('columns')).toBe('2');
        expect(result.get('key1$0')).toBe('value1');
        expect(result.get('key2$0')).toBe(null);
        expect(result.get('key1$1')).toBe('value3');
    });
});
