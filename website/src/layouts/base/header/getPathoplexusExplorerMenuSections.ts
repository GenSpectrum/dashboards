import { getPathoplexusExplorerConfig } from '../../../config.ts';
import { REPORT_KINDS } from '../../../pathoplexusExplorer/domain/reports.ts';
import { MATRIX_LABEL, MATRIX_PATH } from '../../../pathoplexusExplorer/pageState/matrixAddress.ts';
import {
    KIND_LABELS,
    KIND_PATHS,
    REPORTS_BASE_PATH,
    REPORTS_LABEL,
} from '../../../pathoplexusExplorer/pageState/reportKinds.ts';

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
