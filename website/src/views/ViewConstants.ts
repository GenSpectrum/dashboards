import type { MenuIconType } from '../components/iconCss';

export interface ViewConstants {
    label: string;
    labelLong: string;
    pathFragment: string;
    iconType: MenuIconType;
}

export const singleVariantViewConstants = {
    label: 'Single variant',
    labelLong: 'Analyze a single variant',
    pathFragment: 'single-variant',
    iconType: 'magnify',
} as const satisfies ViewConstants;

export const compareVariantsViewConstants = {
    label: 'Compare side-by-side',
    labelLong: 'Compare variants side-by-side',
    pathFragment: 'compare-side-by-side',
    iconType: 'compare',
} as const satisfies ViewConstants;

export const sequencingEffortsViewConstants = {
    label: 'Sequencing efforts',
    labelLong: 'Sequencing efforts',
    pathFragment: 'sequencing-efforts',
    iconType: 'tube',
} as const satisfies ViewConstants;
