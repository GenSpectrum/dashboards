import type { DateRange, LapisLocation, LapisVariantQuery } from './helpers.ts';
import type { Organism } from '../types/Organism.ts';

export type Route = {
    organism: Organism;
    pathname: string;
};

export type BaselineFilter = {
    baselineFilter: {
        location: LapisLocation;
        dateRange: DateRange;
    };
};

export type VariantFilter = {
    variantFilter: LapisVariantQuery;
};

export type RouteWithBaseline = Route & BaselineFilter;

export type AnalyzeSingleVariantRoute = Route & BaselineFilter & VariantFilter;

export type View<R extends Route, ParseResult extends R | undefined = R> = {
    organism: Organism;
    pathname: string;
    label: string;
    labelLong: string;
    defaultRoute: R;

    parseUrl: (url: URL) => ParseResult;
    toUrl: (route: R) => string;
    getDefaultRouteUrl: () => string;
};

export const defaultTablePageSize = 200;
