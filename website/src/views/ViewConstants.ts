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

export const nonBreakingHyphen = '\u2011';
export const compareSideBySideViewConstants = {
    label: `Compare side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
    labelLong: `Compare variants side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
    pathFragment: 'compare-side-by-side',
    iconType: 'table',
} as const satisfies ViewConstants;

export const sequencingEffortsViewConstants = {
    label: 'Sequencing efforts',
    labelLong: 'Sequencing efforts',
    pathFragment: 'sequencing-efforts',
    iconType: 'tube',
} as const satisfies ViewConstants;

export const compareVariantsViewConstants = {
    label: 'Compare variants',
    labelLong: 'Compare variants',
    pathFragment: 'compare-variants',
    iconType: 'compare',
} as const satisfies ViewConstants;

export const compareToBaselineViewConstants = {
    label: 'Compare to baseline',
    labelLong: 'Compare to baseline',
    pathFragment: 'compare-to-baseline',
    iconType: 'chartSankey',
} as const satisfies ViewConstants;
