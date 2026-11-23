import { getPathoplexusExplorerConfig } from '../../../config.ts';
import { MATRIX_LABEL, MATRIX_PATH } from '../../../pathoplexusExplorer/matrix/address.ts';
import {
    KIND_LABELS,
    KIND_PATHS,
    REPORT_KINDS,
    REPORTS_BASE_PATH,
    REPORTS_LABEL,
} from '../../../pathoplexusExplorer/reports/kinds.ts';

export const PATHOPLEXUS_EXPLORER_LABEL = 'Pathoplexus Explorer';

type PathoplexusExplorerMenuSection = {
    headline: string;
    headlineBackgroundColor: string;
    href: string;
    navigationEntries: { label: string; href: string; underlineColor: string }[];
};

export function getPathoplexusExplorerMenuSections(): PathoplexusExplorerMenuSection[] {
    if (getPathoplexusExplorerConfig() === undefined) {
        return [];
    }
    return [
        {
            headline: REPORTS_LABEL,
            href: REPORTS_BASE_PATH,
            headlineBackgroundColor: 'bg-gray-100',
            navigationEntries: REPORT_KINDS.map((kind) => ({
                label: KIND_LABELS[kind],
                href: KIND_PATHS[kind],
                underlineColor: 'decoration-gray-400',
            })),
        },
        {
            headline: MATRIX_LABEL,
            href: MATRIX_PATH,
            headlineBackgroundColor: 'bg-gray-100',
            navigationEntries: [],
        },
    ];
}
