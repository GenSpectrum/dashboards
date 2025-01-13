import { describe, expect, test } from 'vitest';

import { getLocationDisplayConfig, getLocationSubdivision } from './locationHelpers.ts';

const continentField = 'myContinentField';
const countryField = 'myCountryField';
const divisionField = 'myDivisionField';
const locationFields = [continentField, countryField, divisionField];

describe('getLocationDisplayConfig', () => {
    test('should return World with country field if no location is set', () => {
        const locationFilter = {};

        const actual = getLocationDisplayConfig(locationFields, locationFilter);

        const expected = { mapName: 'World', locationField: countryField };
        expect(actual).toEqual(expected);
    });

    test('should return the correct location display config for a continent', () => {
        const locationFilter = {
            [continentField]: 'myContinentValue',
        };

        const actual = getLocationDisplayConfig(locationFields, locationFilter);

        const expected = {
            mapName: 'myContinentValue',
            locationField: countryField,
        };
        expect(actual).toEqual(expected);
    });

    test('should return the correct location display config for a country', () => {
        const locationFilter = {
            [continentField]: 'myContinentValue',
            [countryField]: 'myCountryValue',
        };

        const actual = getLocationDisplayConfig(locationFields, locationFilter);

        const expected = {
            mapName: 'myCountryValue',
            locationField: divisionField,
        };
        expect(actual).toEqual(expected);
    });
});

describe('getLocationSubdivision', () => {
    test('should return empty label and undefined field if there is only one location field', () => {
        const locationFields = ['myField'];
        const locationFilter = {
            myField: 'myValue',
        };

        const actual = getLocationSubdivision(locationFields, locationFilter);

        const expected = { label: '', field: undefined };
        expect(actual).toEqual(expected);
    });

    test('should return the correct location subdivision for a continent', () => {
        const locationFilter = {
            [continentField]: 'myContinentValue',
        };

        const actual = getLocationSubdivision(locationFields, locationFilter);

        const expected = {
            label: 'Country',
            field: countryField,
            locationValue: 'myContinentValue',
        };
        expect(actual).toEqual(expected);
    });

    test('should return the correct location subdivision for a country', () => {
        const locationFilter = {
            [continentField]: 'myContinentValue',
            [countryField]: 'myCountryValue',
        };

        const actual = getLocationSubdivision(locationFields, locationFilter);

        const expected = {
            label: 'Geographic sub-divisions',
            field: divisionField,
            locationValue: 'myCountryValue',
        };
        expect(actual).toEqual(expected);
    });
});
