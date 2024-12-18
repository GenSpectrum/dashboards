import type { LapisLocation } from './helpers.ts';
import { hasOnlyUndefinedValues } from '../util/hasOnlyUndefinedValues.ts';

export function getLocationDisplayConfig(locationFields: string[], locationFilter: LapisLocation) {
    if (hasOnlyUndefinedValues(locationFilter)) {
        const locationField = locationFields.find((it) => isCountryField(it)) ?? locationFields[0];
        return { label: 'World', mapName: 'World', locationField };
    }

    const { label, locationValue, field } = getLocationSubdivision(locationFields, locationFilter);
    return {
        label,
        mapName: locationValue,
        locationField: field,
    };
}

export function getLocationSubdivision(locationFields: string[], locationFilter: LapisLocation) {
    if (locationFields.length <= 1) {
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
