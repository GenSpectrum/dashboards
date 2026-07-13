import { describe, expect, it } from 'vitest';

import { CollectionFilters, CollectionsOverviewPageStateHandler } from './CollectionsOverviewPageStateHandler';

const PATH = '/collections/covid';

describe('CollectionsOverviewPageStateHandler', () => {
    const handler = new CollectionsOverviewPageStateHandler(PATH);

    describe('parsePageStateFromUrl', () => {
        it('defaults to community filter and no tags when URL has no params', () => {
            const url = new URL('http://example.com/collections/covid');
            expect(handler.parsePageStateFromUrl(url)).toEqual({
                filter: CollectionFilters.community,
                tagFilter: [],
            });
        });

        it('parses a non-default filter', () => {
            const url = new URL('http://example.com/collections/covid?filter=official');
            expect(handler.parsePageStateFromUrl(url)).toEqual({
                filter: CollectionFilters.official,
                tagFilter: [],
            });
        });

        it('parses multiple tags', () => {
            const url = new URL('http://example.com/collections/covid?tag=ebola&tag=mpox');
            expect(handler.parsePageStateFromUrl(url)).toEqual({
                filter: CollectionFilters.community,
                tagFilter: ['ebola', 'mpox'],
            });
        });

        it('parses filter and tags together', () => {
            const url = new URL('http://example.com/collections/covid?filter=all&tag=ebola&tag=mpox');
            expect(handler.parsePageStateFromUrl(url)).toEqual({
                filter: CollectionFilters.all,
                tagFilter: ['ebola', 'mpox'],
            });
        });

        it('falls back to default filter for an unrecognised filter value', () => {
            const url = new URL('http://example.com/collections/covid?filter=invalid');
            expect(handler.parsePageStateFromUrl(url)).toEqual({
                filter: CollectionFilters.community,
                tagFilter: [],
            });
        });
    });

    describe('toUrl', () => {
        it('produces a clean URL for the default state', () => {
            expect(handler.toUrl({ filter: CollectionFilters.community, tagFilter: [] })).toBe(PATH);
        });

        it('includes filter param when non-default', () => {
            expect(handler.toUrl({ filter: CollectionFilters.official, tagFilter: [] })).toBe(
                `${PATH}?filter=official&`,
            );
        });

        it('includes tag params', () => {
            expect(handler.toUrl({ filter: CollectionFilters.community, tagFilter: ['ebola', 'mpox'] })).toBe(
                `${PATH}?tag=ebola&tag=mpox&`,
            );
        });

        it('includes both filter and tag params', () => {
            expect(handler.toUrl({ filter: CollectionFilters.all, tagFilter: ['ebola'] })).toBe(
                `${PATH}?filter=all&tag=ebola&`,
            );
        });
    });

    describe('getDefaultPageUrl', () => {
        it('returns the bare path', () => {
            expect(handler.getDefaultPageUrl()).toBe(PATH);
        });
    });
});
