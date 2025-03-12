import type { MenuIconType } from '../components/iconCss';

export interface ViewConstants {
    label: string;
    labelLong: string;
    pathFragment: string;
    iconType: MenuIconType;
    description?: string;
}

export const singleVariantViewConstants = {
    label: 'Single variant',
    labelLong: 'Analyze a single variant',
    pathFragment: 'single-variant',
    iconType: 'magnify',
    description:
        'Analyze a single variant regarding to its prevalence over time, relative growth advantage, mutations and many more.',
} as const satisfies ViewConstants;

export const nonBreakingHyphen = '\u2011';
export const compareSideBySideViewConstants = {
    label: `Compare side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
    labelLong: `Compare variants side${nonBreakingHyphen}by${nonBreakingHyphen}side`,
    pathFragment: 'compare-side-by-side',
    iconType: 'table',
    description: 'Compare two or more variants directly next to each other.',
} as const satisfies ViewConstants;

export const sequencingEffortsViewConstants = {
    label: 'Sequencing efforts',
    labelLong: 'Sequencing efforts',
    pathFragment: 'sequencing-efforts',
    iconType: 'tube',
    description: 'Explore sequencing efforts and basic information around all sequences.',
} as const satisfies ViewConstants;

export const compareVariantsViewConstants = {
    label: 'Compare variants',
    labelLong: 'Compare variants',
    pathFragment: 'compare-variants',
    iconType: 'compare',
    description: 'Compare the prevalence and mutation changes between two variants.',
} as const satisfies ViewConstants;

export const compareToBaselineViewConstants = {
    label: 'Compare to baseline',
    labelLong: 'Compare to baseline',
    pathFragment: 'compare-to-baseline',
    iconType: 'chartSankey',
    description: 'Investigate the prevalence of a variant compared to a baseline variant.',
} as const satisfies ViewConstants;
