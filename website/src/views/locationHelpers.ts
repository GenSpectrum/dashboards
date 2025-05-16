import { hasOnlyUndefinedValues } from '../util/hasOnlyUndefinedValues.ts';
import type { LapisLocation } from './pageStateHandlers/locationFilterFromToUrl.ts';

export function getLocationDisplayConfig(locationFields: string[], locationFilter: LapisLocation | undefined) {
    if (locationFilter === undefined || hasOnlyUndefinedValues(locationFilter)) {
        const locationField = locationFields.find((it) => isCountryField(it)) ?? locationFields[0];
        return { mapName: 'World', locationField };
    }

    const { locationValue, field } = getLocationSubdivision(locationFields, locationFilter);
    return {
        mapName: locationValue,
        locationField: field,
    };
}

export function getLocationSubdivision(locationFields: string[], locationFilter: LapisLocation | undefined) {
    if (locationFields.length <= 1 || locationFilter === undefined) {
        return { label: '', field: undefined };
    }

    for (let i = locationFields.length - 1; i >= 0; i--) {
        const field = locationFields[i];

        const locationValue = locationFilter[field];
        if (locationValue !== undefined) {
            const locationOneLevelUp = locationFields[i + 1];
            if (locationOneLevelUp) {
                return { label: getLocationLabel(locationOneLevelUp), field: locationOneLevelUp, locationValue };
            }

            return { label: '', field: undefined, locationValue };
        }
    }

    return {
        label: getLocationLabel(locationFields[0]),
        field: locationFields[0],
    };
}

function isCountryField(field: string) {
    return field.toLowerCase().includes('country');
}

function getLocationLabel(field: string) {
    if (isCountryField(field)) {
        return 'Country';
    }
    return 'Geographic sub-divisions';
}
